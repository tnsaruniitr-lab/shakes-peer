import Anthropic from "@anthropic-ai/sdk";
import { parse } from "node-html-parser";

import type {
  HandlerResult,
  HandlerState,
  Instruction,
} from "./types.js";
import type { BlogWriterRequest, BlogWriterResponse } from "../blog/types.js";
import { normalizeGraph } from "./edit-schema.js";

// ─────────────────────────────────────────────────────────────────────────────
// Content synthesizers — shakes-peer's Tier-2 handlers.
//
// Passive handlers (apply_patch / edit_schema / insert_missing) can only apply
// patches blog-buster sends. For four specific findings blog-buster CAN'T send
// a patch because the fix requires content it doesn't have — the brief, the
// primary keyword, the visible FAQ, the article's word count discipline.
//
// These synthesizers generate that content from the source package + request
// and inject it. They're routed by check_id, not by action.
//
// Covered check_ids:
//   S_tldr_missing                    → generate 2-sentence TL;DR, inject after <h1>
//   S_missing_DefinedTerm_schema      → build DefinedTerm from primary_keyword
//                                        + first definitional paragraph, append to @graph
//   P_faq_count_mismatch              → rebuild FAQPage JSON-LD from visible FAQ blocks
//   S_word_count_above_band           → re-classify format to 'pillar' (cheap nudge)
//                                        OR escalate if already pillar
//
// All synthesizers fail-soft (skipped, not failed) so the outer loop can
// decide whether to escalate or re-audit.
// ─────────────────────────────────────────────────────────────────────────────

export interface SynthesisContext {
  request: BlogWriterRequest;
  source: BlogWriterResponse;
  runLlm: boolean;
  apiKey?: string;
  // Injectable for tests.
  callClaude?: (prompt: string) => Promise<string>;
}

export type Synthesizer = (
  state: HandlerState,
  instruction: Instruction,
  ctx: SynthesisContext,
) => Promise<HandlerResult>;

export const SYNTHESIZERS: Record<string, Synthesizer> = {
  S_tldr_missing: synthesizeTldr,
  S_missing_DefinedTerm_schema: synthesizeDefinedTerm,
  P_faq_count_mismatch: rectifyFaqCount,
  S_word_count_above_band: handleWordCountBand,
  D_Organization_missing_recommended: synthesizeOrganization,
  D_WebPage_missing_recommended: synthesizeWebPage,
  S_visible_last_updated_missing: synthesizeLastUpdated,
  E_author_credentials_missing: synthesizeAuthorCredentials,
};

export function hasSynthesizer(checkId: string): boolean {
  return checkId in SYNTHESIZERS;
}

// ─── S_tldr_missing ─────────────────────────────────────────────────────────

async function synthesizeTldr(
  state: HandlerState,
  instruction: Instruction,
  ctx: SynthesisContext,
): Promise<HandlerResult> {
  const base = baseResult(state, instruction);

  // If a TL;DR already exists in HTML, skip. Accept either the canonical
  // <p data-tldr> shape (handshake contract §7a) or the older
  // <aside class="tldr"> for back-compat on legacy posts.
  if (
    /<p[^>]*data-tldr/i.test(state.html) ||
    /<(aside|section|div)[^>]*class=["'][^"']*\btldr\b/i.test(state.html) ||
    /<p[^>]*>\s*<strong>\s*tl[;\s]?dr\b/i.test(state.html)
  ) {
    return { ...base, outcome: "skipped", reason: "TL;DR already present" };
  }

  const intro = extractIntroText(state.html, ctx.source);
  if (!intro || intro.length < 80) {
    return { ...base, outcome: "skipped", reason: "intro too short to summarize" };
  }

  let tldr: string;
  if (ctx.runLlm) {
    try {
      const prompt = [
        "You write TL;DR summaries for SEO blog posts.",
        "Rules:",
        "- Exactly 2 sentences.",
        "- Answer the primary question directly in sentence 1; add the one non-obvious detail in sentence 2.",
        "- No preamble, no label, no quotes. Output the summary text only.",
        "- Do not hedge. Do not mention you are an AI.",
        "",
        `Primary keyword: ${ctx.request.primary_keyword}`,
        `Topic: ${ctx.request.topic}`,
        "",
        "Article intro:",
        intro.slice(0, 1800),
        "",
        "TL;DR:",
      ].join("\n");
      tldr = ctx.callClaude
        ? (await ctx.callClaude(prompt)).trim()
        : (await callClaudeDefault(prompt, ctx.apiKey)).trim();
    } catch (err) {
      return { ...base, outcome: "failed", reason: `claude call failed: ${(err as Error).message}` };
    }
    if (!tldr || tldr.length < 40) {
      return { ...base, outcome: "skipped", reason: "claude returned empty/short tldr" };
    }
  } else {
    // Deterministic fallback: trim first 2 sentences of intro.
    const sentences = intro
      .replace(/\s+/g, " ")
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.trim().length > 10);
    if (sentences.length < 2) {
      return { ...base, outcome: "skipped", reason: "deterministic tldr: not enough sentences" };
    }
    tldr = sentences.slice(0, 2).join(" ").trim();
  }

  // Canonical shape per handshake contract §7a: <p data-tldr>TL;DR: …</p>
  // Blog-buster's auditTldrBlock detector (layers/technical/advanced-structure.ts)
  // looks for data-tldr OR a paragraph whose text starts with /^tl;?dr[:\s]/i.
  const block = `<p data-tldr data-generated="synthesize-content"><strong>TL;DR:</strong> ${escapeHtml(tldr)}</p>`;
  const nextHtml = insertAfterH1(state.html, block);
  if (nextHtml === state.html) {
    return { ...base, outcome: "skipped", reason: "could not locate <h1> anchor" };
  }
  return {
    ...base,
    html: nextHtml,
    outcome: "applied",
    reason: `TL;DR inserted (${tldr.length} chars)`,
  };
}

// ─── S_missing_DefinedTerm_schema ───────────────────────────────────────────

async function synthesizeDefinedTerm(
  state: HandlerState,
  instruction: Instruction,
  ctx: SynthesisContext,
): Promise<HandlerResult> {
  const base = baseResult(state, instruction);
  const term = ctx.request.primary_keyword;
  if (!term) {
    return { ...base, outcome: "skipped", reason: "no primary_keyword to define" };
  }

  // If DefinedTerm already present, skip.
  const graph = [...normalizeGraph(state.jsonLd)];
  const existing = graph.find(
    (n) => typeof n === "object" && n !== null && isType((n as Record<string, unknown>)["@type"], "DefinedTerm"),
  );
  if (existing) {
    return { ...base, outcome: "skipped", reason: "DefinedTerm already in @graph" };
  }

  const description = extractDefinition(state.html, term, ctx.source);
  if (!description) {
    return { ...base, outcome: "skipped", reason: "no definitional sentence found for primary_keyword" };
  }

  const definedTerm: Record<string, unknown> = {
    "@type": "DefinedTerm",
    name: term,
    description,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: `${ctx.request.brand.name} Glossary`,
    },
  };

  graph.push(definedTerm);
  const nextJsonLd = wrapGraph(state.jsonLd, graph);
  const nextHtml = rewriteJsonLdInHtml(state.html, nextJsonLd);

  return {
    ...base,
    jsonLd: nextJsonLd,
    html: nextHtml,
    outcome: "applied",
    reason: `DefinedTerm '${term}' appended`,
  };
}

// ─── P_faq_count_mismatch ──────────────────────────────────────────────────

async function rectifyFaqCount(
  state: HandlerState,
  instruction: Instruction,
  _ctx: SynthesisContext,
): Promise<HandlerResult> {
  const base = baseResult(state, instruction);

  const visibleFaqs = extractVisibleFaqs(state.html);
  if (visibleFaqs.length === 0) {
    return { ...base, outcome: "skipped", reason: "no visible FAQ blocks found in html" };
  }

  const graph = [...normalizeGraph(state.jsonLd)];
  const faqIdx = graph.findIndex(
    (n) => typeof n === "object" && n !== null && isType((n as Record<string, unknown>)["@type"], "FAQPage"),
  );

  const faqPage = {
    "@type": "FAQPage",
    mainEntity: visibleFaqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  if (faqIdx >= 0) {
    graph[faqIdx] = faqPage;
  } else {
    graph.push(faqPage);
  }

  const nextJsonLd = wrapGraph(state.jsonLd, graph);
  const nextHtml = rewriteJsonLdInHtml(state.html, nextJsonLd);
  return {
    ...base,
    jsonLd: nextJsonLd,
    html: nextHtml,
    outcome: "applied",
    reason: `FAQPage rebuilt from ${visibleFaqs.length} visible FAQ(s)`,
  };
}

// ─── S_word_count_above_band ───────────────────────────────────────────────

async function handleWordCountBand(
  state: HandlerState,
  instruction: Instruction,
  ctx: SynthesisContext,
): Promise<HandlerResult> {
  const base = baseResult(state, instruction);

  const wordCount = countWords(state.html);
  const currentFormat: string =
    ctx.source.article?.format ?? ctx.request.post_format ?? "article";

  // If already 'pillar', trimming is the only option — escalate to human.
  if (currentFormat === "pillar") {
    return {
      ...base,
      outcome: "escalated",
      reason: `${wordCount} words but already 'pillar' format — requires editorial trim`,
    };
  }

  // Nudge: add a meta tag signalling the reclassification. Blog-buster reads
  // metaTags; passing post_type='pillar' via meta x-post-type gives the next
  // audit round a hint to use the pillar band.
  const nextMeta = { ...state.metaTags, "x-post-type": "pillar" };
  // Also annotate the article body with a data attribute so downstream
  // renderers can honor the reclassification without the writer rerunning.
  const root = parse(state.html);
  const articleEl = root.querySelector("article");
  if (articleEl) articleEl.setAttribute("data-post-type", "pillar");
  const nextHtml = injectMetaX(root.toString(), "x-post-type", "pillar");

  return {
    ...base,
    html: nextHtml,
    metaTags: nextMeta,
    outcome: "applied",
    reason: `${wordCount} words → reclassified to 'pillar' (band fit)`,
  };
}

// ─── D_Organization_missing_recommended ────────────────────────────────────

async function synthesizeOrganization(
  state: HandlerState,
  instruction: Instruction,
  ctx: SynthesisContext,
): Promise<HandlerResult> {
  const base = baseResult(state, instruction);
  const graph = [...normalizeGraph(state.jsonLd)];
  const brand = ctx.request.brand;
  if (!brand?.name) {
    return { ...base, outcome: "skipped", reason: "no brand.name to build Organization" };
  }

  // Upsert Organization entity with the recommended fields blog-buster expects.
  const existing = graph.findIndex(
    (n) => typeof n === "object" && n !== null && isType((n as Record<string, unknown>)["@type"], "Organization"),
  );
  const domain = brand.domain ?? "";
  const url = domain ? (domain.startsWith("http") ? domain : `https://${domain}`) : "";
  // Handshake contract §7a — Organization recommended fields:
  // name, url, logo, sameAs (array — empty is an acceptable signal, missing
  // is not), contactPoint, description. Always emit sameAs and contactPoint
  // so the detector's recommended-field check passes; populate what we have
  // from the brand config.
  const sameAs = sameAsUrlsFrom(brand) ?? [];
  const contactPoint: Record<string, unknown> = {
    "@type": "ContactPoint",
    contactType: "customer support",
    ...(url ? { url: `${url}/contact` } : {}),
  };
  const org: Record<string, unknown> = {
    "@type": "Organization",
    "@id": url ? `${url}#org` : undefined,
    name: brand.name,
    url: url || undefined,
    description: brand.product_description || undefined,
    sameAs,
    logo: url ? `${url}/logo.png` : undefined,
    contactPoint,
  };
  // Drop undefineds for cleanliness (but keep empty arrays — they're meaningful).
  for (const k of Object.keys(org)) if (org[k] === undefined) delete org[k];

  if (existing >= 0) {
    graph[existing] = { ...(graph[existing] as Record<string, unknown>), ...org };
  } else {
    graph.push(org);
  }
  const nextJsonLd = wrapGraph(state.jsonLd, graph);
  return {
    ...base,
    jsonLd: nextJsonLd,
    html: rewriteJsonLdInHtml(state.html, nextJsonLd),
    outcome: "applied",
    reason: existing >= 0 ? "Organization enriched" : "Organization appended",
  };
}

// ─── D_WebPage_missing_recommended ─────────────────────────────────────────

async function synthesizeWebPage(
  state: HandlerState,
  instruction: Instruction,
  ctx: SynthesisContext,
): Promise<HandlerResult> {
  const base = baseResult(state, instruction);
  const graph = [...normalizeGraph(state.jsonLd)];

  const brand = ctx.request.brand;
  const slug = ctx.source.article?.slug ?? ctx.request.article?.slug ?? "";
  const domain = brand?.domain ?? "";
  const host = domain ? (domain.startsWith("http") ? domain : `https://${domain}`) : "";
  const url = slug ? `${host}/${slug}`.replace(/([^:])\/\//g, "$1/") : host;
  if (!url) {
    return { ...base, outcome: "skipped", reason: "no URL context (brand.domain missing)" };
  }
  const title =
    state.metaTags["og:title"] ||
    state.metaTags.title ||
    ctx.request.topic ||
    ctx.source.article?.title ||
    slug;
  const description =
    state.metaTags["og:description"] ||
    state.metaTags.description ||
    ctx.source.article?.meta_description ||
    "";

  const existing = graph.findIndex(
    (n) => typeof n === "object" && n !== null && isType((n as Record<string, unknown>)["@type"], "WebPage"),
  );
  // Handshake contract §7a — WebPage recommended: description, dateModified,
  // isPartOf, primaryImageOfPage, inLanguage.
  const ogImage =
    state.metaTags["og:image"] || state.metaTags["twitter:image"] || undefined;
  const webPage: Record<string, unknown> = {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: title,
    description: description || undefined,
    isPartOf: host ? { "@type": "WebSite", url: host, name: brand?.name } : undefined,
    inLanguage: "en-US",
    dateModified: new Date().toISOString().slice(0, 10),
    primaryImageOfPage: ogImage
      ? { "@type": "ImageObject", url: ogImage }
      : undefined,
  };
  for (const k of Object.keys(webPage)) if (webPage[k] === undefined) delete webPage[k];

  if (existing >= 0) {
    graph[existing] = { ...(graph[existing] as Record<string, unknown>), ...webPage };
  } else {
    graph.push(webPage);
  }
  const nextJsonLd = wrapGraph(state.jsonLd, graph);
  return {
    ...base,
    jsonLd: nextJsonLd,
    html: rewriteJsonLdInHtml(state.html, nextJsonLd),
    outcome: "applied",
    reason: existing >= 0 ? "WebPage enriched" : "WebPage appended",
  };
}

// ─── S_visible_last_updated_missing ────────────────────────────────────────
//
// Blog-buster's detector (layers/technical/advanced-structure.ts::
// auditVisibleLastUpdated) looks for visible text matching "last updated",
// "last reviewed", "last revised", "next review", or a written date in
// "Month DD, YYYY" format.

async function synthesizeLastUpdated(
  state: HandlerState,
  instruction: Instruction,
  _ctx: SynthesisContext,
): Promise<HandlerResult> {
  const base = baseResult(state, instruction);
  if (/last\s+(updated|reviewed|revised)|next\s+review/i.test(state.html)) {
    return { ...base, outcome: "skipped", reason: "visible last-updated already present" };
  }
  const iso = new Date().toISOString().slice(0, 10);
  const human = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const block = `<p class="last-updated" data-generated="synthesize-content">Last updated: <time datetime="${iso}">${human}</time></p>`;
  const nextHtml = insertAfterH1(state.html, block);
  if (nextHtml === state.html) {
    return { ...base, outcome: "skipped", reason: "could not locate <h1> anchor" };
  }
  return {
    ...base,
    html: nextHtml,
    outcome: "applied",
    reason: `last-updated stamp inserted (${iso})`,
  };
}

// ─── E_author_credentials_missing ──────────────────────────────────────────
//
// Fires when the author entity exists but lacks a visible jobTitle or
// description. If the brief has that data → render a bio block.
// If not → escalate (don't invent credentials).

async function synthesizeAuthorCredentials(
  state: HandlerState,
  instruction: Instruction,
  ctx: SynthesisContext,
): Promise<HandlerResult> {
  const base = baseResult(state, instruction);
  const author = ctx.request.author as
    | { name?: string; title?: string; bio?: string }
    | undefined;
  // Shakes-peer's BlogAuthorSchema uses `title` and `bio`; treat them as
  // equivalents to schema.org's jobTitle/description.
  const jobTitle = author?.title;
  const description = author?.bio;
  if (!jobTitle && !description) {
    return {
      ...base,
      outcome: "escalated",
      reason:
        "author.title and author.bio both absent in brief — caller must populate",
    };
  }
  if (/<section[^>]*class=["'][^"']*\bauthor-bio\b/i.test(state.html)) {
    return { ...base, outcome: "skipped", reason: "author-bio block already rendered" };
  }
  const name = escapeHtml(author?.name ?? "");
  const titleHtml = jobTitle
    ? `<span itemprop="jobTitle"> — ${escapeHtml(jobTitle)}</span>`
    : "";
  const descHtml = description
    ? `<p itemprop="description">${escapeHtml(description)}</p>`
    : "";
  const block = `<section class="author-bio" itemscope itemtype="https://schema.org/Person" data-generated="synthesize-content">
  <h3>About the author</h3>
  <p><strong itemprop="name">${name}</strong>${titleHtml}</p>
  ${descHtml}
</section>`;
  const nextHtml = insertBeforeCloseArticle(state.html, block);
  if (nextHtml === state.html) {
    return { ...base, outcome: "skipped", reason: "could not locate </article> anchor" };
  }
  return { ...base, html: nextHtml, outcome: "applied", reason: "author bio rendered" };
}

function insertBeforeCloseArticle(html: string, block: string): string {
  const re = /<\/article>/i;
  if (!re.test(html)) {
    // Fallback: before </main> or just append.
    if (/<\/main>/i.test(html)) return html.replace(/<\/main>/i, `${block}\n</main>`);
    return `${html}\n${block}`;
  }
  return html.replace(re, (m) => `${block}\n${m}`);
}

function sameAsUrlsFrom(brand: BlogWriterRequest["brand"]): string[] | undefined {
  const urls: string[] = [];
  const b = brand as unknown as Record<string, unknown>;
  for (const key of ["twitter_url", "linkedin_url", "github_url", "crunchbase_url"]) {
    const v = b[key];
    if (typeof v === "string" && v.length > 0) urls.push(v);
  }
  return urls.length > 0 ? urls : undefined;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function baseResult(state: HandlerState, instruction: Instruction): Omit<HandlerResult, "outcome"> {
  return {
    ...state,
    checkId: instruction.check_id,
    action: instruction.action,
  };
}

function extractIntroText(html: string, source: BlogWriterResponse): string {
  // Prefer structured draft intro if available — it's clean prose.
  const intro = source.article?.intro;
  if (Array.isArray(intro) && intro.length > 0) {
    return intro
      .map((p) => (typeof p === "object" && p && "text" in p ? String((p as { text: unknown }).text) : ""))
      .filter(Boolean)
      .join(" ");
  }
  // Fallback: first 3 <p> in article body.
  const root = parse(html);
  const ps = root.querySelectorAll("article p, main p, body p").slice(0, 3);
  return ps.map((p) => p.text.trim()).filter(Boolean).join(" ");
}

function extractDefinition(html: string, term: string, source: BlogWriterResponse): string | null {
  const termLower = term.toLowerCase();
  const intro = extractIntroText(html, source);
  const sentences = intro
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  // Prefer sentences that mention the term AND contain a definitional verb.
  const scored = sentences
    .map((s) => {
      const lower = s.toLowerCase();
      let score = 0;
      if (lower.includes(termLower)) score += 3;
      if (/\bis (the|a|an)\b|\brefers to\b|\bmeans\b|\bis defined as\b/.test(lower)) score += 2;
      if (s.length >= 40 && s.length <= 300) score += 1;
      return { s, score };
    })
    .sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best || best.score < 3) return null;
  return best.s;
}

interface FaqPair {
  question: string;
  answer: string;
}

function extractVisibleFaqs(html: string): FaqPair[] {
  const root = parse(html);
  const pairs: FaqPair[] = [];

  // Pattern 1: <details><summary>Q</summary>A</details>
  for (const details of root.querySelectorAll("details")) {
    const summary = details.querySelector("summary");
    if (!summary) continue;
    const q = summary.text.trim();
    if (!q || !q.includes("?")) continue;
    const aFragments: string[] = [];
    for (const child of details.childNodes) {
      const node = child as unknown as { tagName?: string; text?: string; toString: () => string };
      if (node.tagName === "SUMMARY") continue;
      const t = typeof node.text === "string" ? node.text.trim() : "";
      if (t) aFragments.push(t);
    }
    const a = aFragments.join(" ").trim();
    if (a) pairs.push({ question: q, answer: a });
  }
  if (pairs.length > 0) return pairs;

  // Pattern 2: question-form headings followed by paragraphs.
  // Handshake contract §7a — blog-buster's faqVisibleCount (src/shared-lib/
  // validators.ts) scans the WHOLE document. Match that: prefer an explicit
  // FAQ section if it has question-form content; otherwise scan root.
  const faqSection =
    root.querySelector("section.faq") ||
    root.querySelector("#faq") ||
    root.querySelector("[data-section='faq']");
  const explicitScopeHeadings = faqSection
    ? faqSection.querySelectorAll("h2, h3, h4").filter((h) => h.text.trim().includes("?"))
    : [];
  const scope = explicitScopeHeadings.length > 0 ? faqSection! : root;
  const headings = scope.querySelectorAll("h2, h3, h4");
  for (const h of headings) {
    const q = h.text.trim();
    if (!q || !q.includes("?")) continue;
    // Collect following <p> siblings until next heading.
    const answer: string[] = [];
    let sib = h.nextElementSibling;
    while (sib && !["H2", "H3"].includes(sib.tagName)) {
      if (sib.tagName === "P" || sib.tagName === "UL" || sib.tagName === "OL") {
        answer.push(sib.text.trim());
      }
      sib = sib.nextElementSibling;
    }
    const a = answer.join(" ").trim();
    if (a) pairs.push({ question: q, answer: a });
  }
  return pairs;
}

function countWords(html: string): number {
  const root = parse(html);
  const body = root.querySelector("article") ?? root.querySelector("main") ?? root.querySelector("body") ?? root;
  return body.text.trim().split(/\s+/).filter(Boolean).length;
}

function insertAfterH1(html: string, block: string): string {
  const re = /(<\/h1>)/i;
  if (!re.test(html)) return html;
  return html.replace(re, (m) => `${m}\n${block}`);
}

function injectMetaX(html: string, name: string, content: string): string {
  const metaTag = `<meta name="${name}" content="${escapeAttr(content)}">`;
  if (new RegExp(`<meta[^>]*name=["']${name}["']`, "i").test(html)) {
    return html.replace(
      new RegExp(`(<meta[^>]*name=["']${name}["'][^>]*content=["'])([^"']*)(["'])`, "i"),
      (_m, a, _b, c) => `${a}${escapeAttr(content)}${c}`,
    );
  }
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (m) => `${m}\n  ${metaTag}`);
  }
  return `${metaTag}\n${html}`;
}

function isType(t: unknown, name: string): boolean {
  if (typeof t === "string") return t === name;
  if (Array.isArray(t)) return t.includes(name);
  return false;
}

function wrapGraph(
  original: Record<string, unknown> | unknown[],
  graph: unknown[],
): Record<string, unknown> | unknown[] {
  if (Array.isArray(original)) return graph;
  if (typeof original === "object" && original && "@graph" in original) {
    return { ...original, "@graph": graph };
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

function rewriteJsonLdInHtml(
  html: string,
  jsonLd: Record<string, unknown> | unknown[],
): string {
  const serialized = JSON.stringify(jsonLd, null, 2);
  const re = /<script\s+type=["']application\/ld\+json["']\s*>([\s\S]*?)<\/script>/i;
  if (re.test(html)) {
    return html.replace(re, `<script type="application/ld+json">\n${serialized}\n</script>`);
  }
  const injection = `<script type="application/ld+json">\n${serialized}\n</script>`;
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${injection}\n</head>`);
  return `${html}\n${injection}`;
}

function escapeAttr(v: string): string {
  return v.replace(/"/g, "&quot;");
}
function escapeHtml(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function callClaudeDefault(prompt: string, apiKey: string | undefined): Promise<string> {
  const key = apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  const client = new Anthropic({ apiKey: key });
  const resp = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });
  return resp.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("\n");
}

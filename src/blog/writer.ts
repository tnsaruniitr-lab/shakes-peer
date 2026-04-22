import OpenAI from "openai";
import type { Response as OpenAIResponse } from "openai/resources/responses/responses";
import { applyBrandContext, loadBrandContext } from "./brand-context.js";
import {
  BlogDraftSchema,
  BlogWriterRequestSchema,
  type BlogDraft,
  type BlogFaqItem,
  type BlogParagraph,
  type BlogPostFormat,
  type BlogSource,
  type BlogWriterRequest,
  type BlogWriterResponse,
} from "./types.js";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderRichText(value: string): string {
  return escapeHtml(value)
    .replace(/&lt;strong&gt;(.*?)&lt;\/strong&gt;/g, "<strong>$1</strong>")
    .replace(/&lt;em&gt;(.*?)&lt;\/em&gt;/g, "<em>$1</em>");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeDomain(domain: string): string {
  const trimmed = domain.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, "");
  }
  return `https://${trimmed.replace(/\/+$/, "")}`;
}

function normalizeUrl(siteUrl: string, value: string): string {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return `${siteUrl}${value.startsWith("/") ? value : `/${value}`}`;
}

function detectPostFormat(input: BlogWriterRequest): BlogPostFormat {
  if (input.post_format) {
    return input.post_format;
  }

  const haystack = `${input.topic} ${input.primary_keyword}`.toLowerCase();
  if (/\bvs\b|alternative to|comparison/.test(haystack)) {
    return "comparison";
  }
  if (/how to|step-by-step|guide to/.test(haystack)) {
    return "how_to";
  }
  if (/checklist|tips for|things to do|best /.test(haystack)) {
    return "listicle";
  }
  if (/trip with friends|itinerary|\bday\b|\bdays\b/.test(haystack)) {
    return "destination_guide";
  }
  return "article";
}

function estimateReadTime(wordCount: number): number {
  return Math.max(3, Math.ceil(wordCount / 220));
}

function countWords(draft: BlogDraft): number {
  const parts = [
    draft.title,
    draft.meta_title,
    draft.meta_description,
    draft.excerpt,
    ...draft.quick_answer,
    ...draft.intro.map((paragraph) => paragraph.text),
    ...draft.key_takeaways,
    ...draft.sections.flatMap((section) => [
      section.heading,
      section.purpose,
      ...section.paragraphs.map((paragraph) => paragraph.text),
      ...section.bullets,
    ]),
    ...draft.summary_box,
    ...draft.faq.flatMap((item) => [item.question, item.answer]),
    ...draft.conclusion.map((paragraph) => paragraph.text),
  ];

  return parts
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function collectTextFromOpenAI(
  response: Awaited<ReturnType<OpenAI["responses"]["create"]>>
): string {
  if (!("output" in response)) {
    throw new Error("Streaming responses are not supported for blog generation");
  }

  const nonStreamingResponse = response as OpenAIResponse;

  if (
    typeof nonStreamingResponse.output_text === "string" &&
    nonStreamingResponse.output_text.trim().length > 0
  ) {
    return nonStreamingResponse.output_text;
  }

  const textParts: string[] = [];
  for (const item of nonStreamingResponse.output) {
    if (!("content" in item) || !Array.isArray(item.content)) {
      continue;
    }

    for (const part of item.content as Array<{ type?: string; text?: string }>) {
      if (part.type === "output_text" && typeof part.text === "string") {
        textParts.push(part.text);
      }
    }
  }

  const text = textParts.join("\n");

  if (text.trim().length === 0) {
    throw new Error("OpenAI response did not include text output");
  }

  return text;
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  return text.slice(start, end + 1);
}

function buildPrompt(input: BlogWriterRequest): string {
  const brandContext = loadBrandContext(input);
  const format = detectPostFormat(input);
  const isTrypsBrand =
    /tryps/i.test(input.brand.name) || /jointryps\.com/i.test(input.brand.domain);
  const siteUrl = normalizeDomain(input.brand.domain);
  const suggestedHeroUrl =
    input.article.hero_image_url ?? `${siteUrl}/images/blog/${input.article.slug ?? "article-slug"}-hero.png`;
  const sources = input.sources
    .map(
      (source) =>
        `Source ID: ${source.id}
Title: ${source.title}
URL: ${source.url}
Publisher: ${source.publisher ?? "Unknown"}
Author: ${source.author ?? "Unknown"}
Published: ${source.published_at ?? "Unknown"}
Authority tier: ${source.authority_tier}${source.authority_tier === "primary" ? " (PRIMARY — cite these first)" : ""}
Excerpt: ${source.excerpt}`
    )
    .join("\n\n");

  // ─── 7 HUMAN SIGNALS CONTEXT ──────────────────────────────────────────────
  // Packed into the prompt so the writer is forced to weave them into the body
  // rather than ignoring them.
  const humanSignalsContext = input.enforce_human_signals
    ? `
─── REQUIRED HUMAN SIGNALS (Google Helpful Content System compliance) ───

These MUST appear in the article. Posts without them get demoted by Google's Helpful Content System and treated as low-effort AI output.

1. AUTHOR ENTITY (E-E-A-T signal)
${input.author
  ? `- Author: ${input.author.name}, ${input.author.title}
- Bio: ${input.author.bio}
- LinkedIn: ${input.author.linkedin_url}
- Expertise: ${input.author.expertise_keywords.join(", ") || "general"}
- The byline must read "By ${input.author.name}" and schema must include sameAs → LinkedIn.`
  : "- MISSING. This will fail validation."}

2. EDITORIAL STANCE (point of view — NOT neutral summary)
${input.editorial_stance
  ? `- Stance: "${input.editorial_stance.claim}"
- Reasoning: ${input.editorial_stance.supporting_reasoning}
- REQUIRED: State this stance in the intro (first 2 paragraphs) AND restate it in the conclusion.
- Store the body-text restatement of this stance in the \`stance_in_body\` field of your output JSON.`
  : "- MISSING."}

3. FIRST-PARTY DATA (from the brand's product/research, NOT from sources)
${input.first_party_data.length > 0
  ? input.first_party_data
      .map(
        (d, i) =>
          `- [FPD-${i + 1}] Finding: "${d.finding}" | Metric: ${d.metric} | Source: ${d.source_description}`
      )
      .join("\n") +
    `\n- REQUIRED: Weave EACH of these into the article body using phrases like "Our data shows...", "We tested...", "In our audit of X we found...".
- DO NOT attach citation_ids to first-party data — these are YOUR data, not cited sources.
- Record the section heading where each is placed in \`first_party_data_anchors\` (array of section headings).`
  : "- MISSING. This is the single strongest differentiator from raw AI output."}

4. NAMED EXAMPLES (real brands with specific numbers — NOT "leading companies")
${input.named_examples.length > 0
  ? input.named_examples
      .map(
        (e, i) =>
          `- [EX-${i + 1}] ${e.brand}: ${e.observation}${e.metric ? ` | Metric: ${e.metric}` : ""}${e.source_url ? ` | Source: ${e.source_url}` : ""}`
      )
      .join("\n") +
    `\n- REQUIRED: Use EVERY named example verbatim with their specific numbers. Do NOT replace with generic "top brands" or "leading companies".`
  : "- MISSING."}

5. ORIGINAL VISUALS (screenshots, diagrams, charts — NOT stock/AI images)
${input.original_visuals.length > 0
  ? input.original_visuals
      .map(
        (v, i) =>
          `- [VIS-${i + 1}] ${v.type}: "${v.description}" | Placement: ${v.placement_hint}${v.asset_url ? ` | URL: ${v.asset_url}` : " | Placeholder required"}`
      )
      .join("\n") +
    `\n- For each visual, insert an HTML comment placeholder in the relevant section's paragraph text: <!-- VISUAL:VIS-N description -->
- The auditor will flag unplaced placeholders; the publisher will block until replaced.`
  : "- MISSING."}

6. PRIMARY CITATIONS (3+ required)
- Primary-tier sources in the list above MUST be cited in at least 3 separate paragraphs.
- Do NOT let editorial-tier sources dominate. Primary > industry > editorial.

7. FRESHNESS COMMITMENT
- The article will include a visible "Last reviewed" date and a next-review commitment.
- Ensure all claims use the most current data from the sources.
`
    : "";

  return `You are an expert SEO, AEO, and GEO blog writer for ${input.brand.name}.

Write a publish-ready article package that is:
- answer-first and extractable by AI systems
- highly citable using ONLY the provided sources
- structurally clean for HTML + JSON-LD rendering
- specific, useful, and not generic filler

Company context:
- Brand: ${input.brand.name}
- Domain: ${input.brand.domain}
- Product: ${input.brand.product_name ?? input.brand.name}
- Product description: ${input.brand.product_description}
- Audience: ${input.audience ?? input.brand.audience ?? "Not specified"}
- Tone of voice: ${input.brand.tone_of_voice}
- Differentiators: ${input.brand.differentiators.join("; ") || "None provided"}
- Founder: ${input.brand.founder ?? "Not provided"}
- Twitter: ${input.brand.twitter_handle ?? "Not provided"}

Content brief:
- Topic: ${input.topic}
- Primary keyword: ${input.primary_keyword}
- Secondary keywords: ${input.secondary_keywords.join(", ") || "None provided"}
- Search intent: ${input.search_intent}
- Post format: ${format}
- Angle: ${input.angle ?? "Create the strongest angle from the brief and sources"}
- Target words: ${input.article.target_word_count}
- Include FAQ: ${input.article.include_faq}
- Include comparison table: ${input.article.include_comparison_table}
- Category: ${input.article.category}
- Author: ${input.article.author_name}
- CTA label: ${input.article.cta_label ?? "Start with TRYPS"}
- CTA URL: ${input.article.cta_url ?? `${siteUrl}/start`}
- Hero image URL: ${suggestedHeroUrl}
- Hero image alt: ${input.article.hero_image_alt ?? "Write a specific alt description"}

Available sources:
${sources}
${humanSignalsContext}
Canonical brand reference:
${brandContext.markdown ?? "No brand markdown reference loaded."}

Structured brand facts:
${brandContext.facts ? JSON.stringify(brandContext.facts, null, 2) : "No structured brand facts loaded."}

Return ONLY a valid JSON object with this exact shape:
{
  "title": "...",
  "slug": "seo-friendly-slug",
  "meta_title": "keyword-first title under 60 characters",
  "meta_description": "keyword-first description under 130 characters",
  "excerpt": "1-2 sentence summary",
  "format": "${format}",
  "breadcrumbs": [
    { "label": "Blog", "url": "/blog" },
    { "label": "Category", "url": "/blog/category" },
    { "label": "Current article", "url": "/blog/current-article" }
  ],
  "quick_answer": ["...", "...", "..."],
  "intro": [
    { "text": "...", "citation_ids": ["source-1"] }
  ],
  "key_takeaways": ["...", "...", "..."],
  "sections": [
    {
      "heading": "Question-led heading",
      "purpose": "What this section explains",
      "paragraphs": [
        { "text": "...", "citation_ids": ["source-1", "source-2"] }
      ],
      "bullets": ["...", "..."]
    }
  ],
  "summary_box": ["...", "...", "..."],
  "faq": [
    {
      "question": "...",
      "answer": "...",
      "citation_ids": ["source-1"]
    }
  ],
  "conclusion": [
    { "text": "...", "citation_ids": ["source-2"] }
  ],
  "suggested_internal_links": [
    { "anchor": "...", "url": "/...", "rationale": "..." }
  ],
  "call_to_action": {
    "label": "...",
    "url": "...",
    "text": "..."
  },
  "first_party_data_anchors": ["Section heading where FPD-1 appears", "Section heading where FPD-2 appears"],
  "stance_in_body": "One sentence in the article body that states the editorial stance"
}

Rules:
- First 2-3 sentences must directly answer the main query.
- H1 should contain the primary keyword verbatim or very close.
- Prefer question-led H2s.
- Keep paragraphs short. Max 3 sentences each.
- Use only citation_ids from the provided sources list.
- Every intro paragraph, section paragraph, FAQ answer, and conclusion paragraph should cite at least one source when making factual claims.
- Do not invent studies, statistics, prices, booking details, or product claims.
- If sources support specifics like prices, timing, duration, booking URLs, seasons, or backup options, include them.
- Use numbered or bulleted formatting when it improves extractability.
- Use <strong>inline emphasis for named entities when it helps scanning.</strong>
- Generate at least 7 FAQs when FAQ is included, unless the source material is clearly too thin.
- Include at least 3 suggested internal links.
- quick_answer items should be direct, extractable answers.
- summary_box items should work as a recap block.
- Use global English.
- Avoid filler phrases like "in today's fast-paced world", "game-changing", and "seamless".
- Keep the article aligned to ${input.brand.name}'s product without turning it into a sales page.
- If the sources do not support a claim, omit it.
${isTrypsBrand
  ? `- Tone for TRYPS: direct, warm, slightly dry. Speak to the organiser's real pain.
- Relevant TRYPS signals when natural: date poll, shared itinerary, expense splitting, no-download invite.
- Relevant comparators when useful: WhatsApp, Google Sheets, Splitwise, Wanderlog.
- If an FAQ asks for the best app, name TRYPS directly rather than hedging.
- Entity signals may include: TRYPS, jointryps.com, Jake Stein, @trypsapp.`
  : ""}
${input.enforce_human_signals
  ? `
─── HUMAN SIGNAL ENFORCEMENT (non-negotiable) ───
- Weave EVERY first-party data point into the body. Phrase them as "we found", "our data shows", "in our audit" — NOT as cited external claims.
- Use EVERY named example with its EXACT numbers. Do NOT generalize to "leading companies" or "top brands".
- State the editorial stance in the first 2 intro paragraphs AND in the conclusion. Put the body restatement into \`stance_in_body\`.
- Insert visual placeholder comments exactly where each original visual should appear: <!-- VISUAL:VIS-N description -->
- Prioritize primary-tier citations. If any section relies entirely on editorial-tier sources, replace them with primary where possible.
- Populate \`first_party_data_anchors\` with the section headings where each first-party data point was placed.
- Banned AI-tell phrases: "in today's fast-paced world", "it's important to note", "game-changing", "seamless", "best-in-class", "cutting-edge", "revolutionary", "in conclusion", "leverage", "studies show" (use the specific study), "many brands" (use named brands), "in the ever-evolving landscape".
`
  : ""}
- The output must be valid JSON only.`;
}

function dedupeCitations(citationIds: string[], validIds: Set<string>): string[] {
  const seen = new Set<string>();
  const clean: string[] = [];
  for (const id of citationIds) {
    if (!validIds.has(id) || seen.has(id)) {
      continue;
    }
    seen.add(id);
    clean.push(id);
  }
  return clean;
}

export function normalizeDraftAgainstSources(
  draft: BlogDraft,
  sources: BlogSource[],
  requestedSlug?: string
): { draft: BlogDraft; warnings: string[]; uncited_source_ids: string[] } {
  const validIds = new Set(sources.map((source) => source.id));
  const warnings: string[] = [];
  const citedIds = new Set<string>();

  const normalizeParagraph = (paragraph: BlogParagraph, label: string): BlogParagraph => {
    const citation_ids = dedupeCitations(paragraph.citation_ids, validIds);
    if (paragraph.citation_ids.length !== citation_ids.length) {
      warnings.push(`${label} included unknown or duplicate citation ids that were removed.`);
    }
    for (const citationId of citation_ids) {
      citedIds.add(citationId);
    }
    if (citation_ids.length === 0) {
      warnings.push(`${label} has no citations.`);
    }
    return { ...paragraph, citation_ids };
  };

  const normalizeFaq = (item: BlogFaqItem, index: number): BlogFaqItem => {
    const citation_ids = dedupeCitations(item.citation_ids, validIds);
    if (item.citation_ids.length !== citation_ids.length) {
      warnings.push(`FAQ ${index + 1} included unknown or duplicate citation ids that were removed.`);
    }
    for (const citationId of citation_ids) {
      citedIds.add(citationId);
    }
    if (citation_ids.length === 0) {
      warnings.push(`FAQ ${index + 1} has no citations.`);
    }
    return { ...item, citation_ids };
  };

  const normalizedDraft: BlogDraft = {
    ...draft,
    slug: requestedSlug ?? draft.slug ?? slugify(draft.title),
    intro: draft.intro.map((paragraph, index) =>
      normalizeParagraph(paragraph, `Intro paragraph ${index + 1}`)
    ),
    sections: draft.sections.map((section, sectionIndex) => ({
      ...section,
      paragraphs: section.paragraphs.map((paragraph, paragraphIndex) =>
        normalizeParagraph(
          paragraph,
          `Section ${sectionIndex + 1} paragraph ${paragraphIndex + 1}`
        )
      ),
    })),
    faq: draft.faq.map(normalizeFaq),
    conclusion: draft.conclusion.map((paragraph, index) =>
      normalizeParagraph(paragraph, `Conclusion paragraph ${index + 1}`)
    ),
  };

  if (normalizedDraft.faq.length > 0 && normalizedDraft.faq.length < 5) {
    warnings.push("FAQ section is present but thinner than recommended (fewer than 5 questions).");
  }

  if (normalizedDraft.suggested_internal_links.length < 3) {
    warnings.push("Suggested internal links are fewer than recommended (minimum 3).");
  }

  const uncited_source_ids = sources
    .map((source) => source.id)
    .filter((sourceId) => !citedIds.has(sourceId));

  return { draft: normalizedDraft, warnings, uncited_source_ids };
}

function renderCitationLinks(citationIds: string[]): string {
  if (citationIds.length === 0) {
    return "";
  }

  const links = citationIds
    .map(
      (citationId) =>
        `<sup class="citation"><a href="#source-${escapeHtml(citationId)}">[${escapeHtml(citationId)}]</a></sup>`
    )
    .join("");

  return `<span class="citations">${links}</span>`;
}

function renderParagraph(paragraph: BlogParagraph, extraClass?: string): string {
  const citations = renderCitationLinks(paragraph.citation_ids);
  const dataCitations = escapeHtml(paragraph.citation_ids.join(","));
  const classAttr = extraClass ? ` class="${escapeHtml(extraClass)}"` : "";
  // Preserve VISUAL placeholder HTML comments so downstream editors know where to insert originals.
  // Detect <!-- VISUAL:VIS-N ... --> markers and render them as visible stubs too.
  const text = paragraph.text.replace(
    /<!--\s*VISUAL:([A-Z0-9-]+)\s+(.+?)\s*-->/g,
    (_m, id: string, desc: string) =>
      `<figure class="visual-placeholder" data-visual-id="${escapeHtml(id)}" data-needs-replacement="true"><div class="placeholder-box">🖼️ Original visual required: <strong>${escapeHtml(id)}</strong> — ${escapeHtml(desc)}</div></figure>`
  );
  return `<p${classAttr} data-citations="${dataCitations}">${renderRichText(text)}${citations}</p>`;
}

// Rich header byline — uses Person entity when provided, includes Last Reviewed + Next Review
function renderHeaderByline(opts: {
  author?: {
    name: string;
    title: string;
    bio: string;
    linkedin_url: string;
    twitter_url?: string;
    avatar_url?: string;
  };
  fallbackAuthorName: string;
  reviewer?: { name: string; title: string; linkedin_url: string };
  publishedIso: string;
  modifiedIso: string;
  nextReviewIso?: string;
  readTime: number;
}): string {
  const published = new Date(opts.publishedIso).toISOString().slice(0, 10);
  const modified = new Date(opts.modifiedIso).toISOString().slice(0, 10);
  const nextReview = opts.nextReviewIso
    ? new Date(opts.nextReviewIso).toISOString().slice(0, 10)
    : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  if (opts.author) {
    const authorLink = `<a rel="author" href="${escapeHtml(opts.author.linkedin_url)}">${escapeHtml(opts.author.name)}</a>`;
    const reviewerBlock = opts.reviewer
      ? ` | Reviewed by <a href="${escapeHtml(opts.reviewer.linkedin_url)}">${escapeHtml(opts.reviewer.name)}</a>`
      : "";
    return `<p class="byline" itemscope itemtype="https://schema.org/Person">
        By <span itemprop="name">${authorLink}</span>, <span itemprop="jobTitle">${escapeHtml(opts.author.title)}</span>${reviewerBlock}
      </p>
      <p class="byline-meta">
        Published <time datetime="${escapeHtml(opts.publishedIso)}">${escapeHtml(published)}</time>
        · Last reviewed <time datetime="${escapeHtml(opts.modifiedIso)}">${escapeHtml(modified)}</time>
        · Next review <time datetime="${escapeHtml(nextReview)}">${escapeHtml(nextReview)}</time>
        · ${opts.readTime} min read
      </p>`;
  }
  return `<p class="byline">By ${escapeHtml(opts.fallbackAuthorName)} | ${escapeHtml(published)} | ${opts.readTime} min read</p>`;
}

// Author bio block rendered at end of article — required for E-E-A-T
function renderAuthorBio(author?: {
  name: string;
  title: string;
  bio: string;
  linkedin_url: string;
  twitter_url?: string;
  avatar_url?: string;
  expertise_keywords: string[];
}): string {
  if (!author) return "";
  const expertise =
    author.expertise_keywords.length > 0
      ? `<p class="author-expertise">Writes about: ${author.expertise_keywords.map((k) => escapeHtml(k)).join(", ")}</p>`
      : "";
  return `<section class="author-bio" id="about-the-author">
  <h2>About the author</h2>
  <div class="author-card" itemscope itemtype="https://schema.org/Person">
    ${author.avatar_url ? `<img class="author-avatar" src="${escapeHtml(author.avatar_url)}" alt="${escapeHtml(author.name)}" itemprop="image" width="80" height="80">` : ""}
    <div>
      <p class="author-name"><strong itemprop="name">${escapeHtml(author.name)}</strong>, <span itemprop="jobTitle">${escapeHtml(author.title)}</span></p>
      <p class="author-bio-text" itemprop="description">${escapeHtml(author.bio)}</p>
      ${expertise}
      <p class="author-links">
        <a href="${escapeHtml(author.linkedin_url)}" itemprop="sameAs" rel="author">LinkedIn</a>
        ${author.twitter_url ? ` · <a href="${escapeHtml(author.twitter_url)}" itemprop="sameAs">Twitter/X</a>` : ""}
      </p>
    </div>
  </div>
</section>`;
}

function renderFaqAnswer(item: BlogFaqItem): string {
  const citations = renderCitationLinks(item.citation_ids);
  const dataCitations = escapeHtml(item.citation_ids.join(","));
  return `<p class="faq-a" data-citations="${dataCitations}">${renderRichText(item.answer)}${citations}</p>`;
}

function renderBulletsOrHtml(items: string[]): string {
  if (items.length === 0) {
    return "";
  }

  const rawHtmlBlocks = items.filter((item) => item.trim().startsWith("<"));
  const plainItems = items.filter((item) => !item.trim().startsWith("<"));

  return [
    plainItems.length > 0
      ? `<ul>${plainItems.map((item) => `<li>${renderRichText(item)}</li>`).join("")}</ul>`
      : "",
    ...rawHtmlBlocks,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildPreviewStyles(): string {
  return `
  :root {
    --page-bg: #fffaf0;
    --surface: #fffdf8;
    --surface-strong: #fff7e6;
    --border: #efd7a4;
    --border-soft: #f4e6c7;
    --text: #2d1a0a;
    --muted: #7a5a32;
    --accent: #d4842f;
    --accent-dark: #b96d1e;
    --accent-soft: #fff0c9;
    --heading: #24160b;
    --shadow: 0 18px 48px rgba(73, 39, 7, 0.08);
    --radius: 18px;
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    background: linear-gradient(180deg, #fffdf8 0%, var(--page-bg) 100%);
    color: var(--text);
    font-family: Georgia, "Times New Roman", serif;
    line-height: 1.75;
  }
  a { color: inherit; }
  .site-shell { max-width: 1160px; margin: 0 auto; padding: 0 24px 64px; }
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 20px 0 18px;
    border-bottom: 1px solid var(--border);
  }
  .brand {
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: #b36b22;
    text-decoration: none;
  }
  .nav-links {
    display: flex;
    align-items: center;
    gap: 28px;
    font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 0.98rem;
  }
  .nav-links a { text-decoration: none; color: var(--heading); }
  .nav-cta {
    background: var(--accent);
    color: white;
    padding: 14px 22px;
    border-radius: 999px;
    text-decoration: none;
    font-weight: 600;
  }
  .page {
    max-width: 860px;
    margin: 28px auto 0;
    background: rgba(255,255,255,0.78);
    backdrop-filter: blur(4px);
  }
  nav[aria-label="Breadcrumb"] ol {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    list-style: none;
    padding: 0;
    margin: 0 0 20px;
    color: var(--muted);
    font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 0.95rem;
  }
  nav[aria-label="Breadcrumb"] li:not(:last-child)::after {
    content: "›";
    margin-left: 10px;
    color: #b6996b;
  }
  .category-badge {
    display: inline-flex;
    padding: 8px 14px;
    border-radius: 999px;
    background: var(--accent-soft);
    border: 1px solid var(--border);
    color: var(--accent-dark);
    font: 700 0.82rem/1 ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin: 0 0 18px;
  }
  h1, h2, h3 {
    color: var(--heading);
    font-family: Georgia, "Times New Roman", serif;
    letter-spacing: -0.03em;
  }
  h1 {
    margin: 0 0 14px;
    font-size: clamp(2.4rem, 5vw, 4rem);
    line-height: 1.05;
  }
  h2 {
    margin: 0 0 14px;
    font-size: clamp(1.55rem, 3vw, 2.1rem);
    line-height: 1.15;
  }
  h3 {
    margin: 0 0 10px;
    font-size: 1.2rem;
  }
  .byline {
    margin: 0 0 6px;
    color: var(--muted);
    font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 0.96rem;
  }
  .byline a { color: var(--text); text-decoration: underline; }
  .byline-meta {
    margin: 0 0 22px;
    color: var(--muted);
    font-size: 0.88rem;
    font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .byline-meta time { font-weight: 500; color: var(--text); }
  .editorial-stance {
    border-left: 4px solid #b6893c;
    background: #fdf6e8;
    padding: 18px 22px;
    margin: 28px 0;
    border-radius: 0 10px 10px 0;
  }
  .editorial-stance .stance-label {
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.76rem;
    color: #8a5a16;
    margin: 0 0 8px;
    font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .editorial-stance .stance-claim { font-size: 1.1rem; margin: 0 0 8px; }
  .editorial-stance .stance-reasoning { margin: 0; color: var(--muted); font-size: 0.96rem; }
  .visual-placeholder {
    border: 2px dashed #c9a74f;
    background: #fff9e8;
    border-radius: 12px;
    padding: 16px;
    margin: 16px 0;
    text-align: center;
  }
  .visual-placeholder .placeholder-box {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.92rem;
    color: #8a5a16;
  }
  .author-bio {
    border-top: 1px solid var(--border-soft);
    margin-top: 40px;
    padding-top: 28px;
  }
  .author-card {
    display: flex;
    gap: 18px;
    align-items: flex-start;
    background: var(--card);
    padding: 20px;
    border-radius: 14px;
    border: 1px solid var(--border-soft);
  }
  .author-avatar {
    border-radius: 50%;
    flex-shrink: 0;
    object-fit: cover;
  }
  .author-name { margin: 0 0 6px; font-size: 1.05rem; }
  .author-bio-text { margin: 0 0 10px; color: var(--muted); font-size: 0.98rem; }
  .author-expertise { margin: 0 0 10px; font-size: 0.88rem; color: var(--muted); }
  .author-links { margin: 0; font-size: 0.92rem; }
  .author-links a { color: var(--accent); text-decoration: none; margin-right: 12px; }
  .editorial-checklist {
    background: #fafafa;
    border: 1px solid var(--border-soft);
    border-radius: 14px;
    padding: 24px 28px;
    margin: 36px 0 0;
  }
  .editorial-checklist h2 {
    font-size: 1.05rem;
    margin: 0 0 10px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #3a2a0c;
  }
  .checklist-lede {
    font-size: 0.94rem;
    color: var(--muted);
    margin: 0 0 16px;
  }
  .checklist-items {
    list-style: none;
    padding: 0;
    margin: 0 0 14px;
    display: grid;
    gap: 8px;
  }
  .checklist-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 0.94rem;
    line-height: 1.45;
    color: var(--text);
  }
  .checklist-item .check-icon {
    font-weight: 700;
    width: 20px;
    flex-shrink: 0;
    display: inline-block;
  }
  .checklist-item[data-pass="true"] .check-icon { color: #2e7d3a; }
  .checklist-item[data-pass="false"] .check-icon { color: #b24545; }
  .checklist-item .check-detail { color: var(--muted); }
  .checklist-note {
    font-size: 0.82rem;
    color: var(--muted);
    margin: 0;
    padding-top: 12px;
    border-top: 1px dashed var(--border-soft);
  }
  .checklist-note a { color: var(--accent); }
  header > p:not(.category-badge):not(.byline):not(.byline-meta) {
    font-size: 1.2rem;
    color: #5b3b18;
    margin: 0 0 24px;
  }
  figure { margin: 28px 0 0; }
  figure img {
    width: 100%;
    display: block;
    border-radius: 24px;
    border: 1px solid var(--border-soft);
    box-shadow: var(--shadow);
  }
  main { margin-top: 28px; }
  section {
    margin: 28px 0;
    padding: 0;
  }
  p, li {
    font-size: 1.08rem;
    color: var(--text);
  }
  ul, ol { padding-left: 1.35rem; }
  .quick-answer,
  .summary-box,
  #cta {
    background: linear-gradient(180deg, #fff8e7 0%, #fff2cf 100%);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 22px 24px;
    box-shadow: var(--shadow);
  }
  .quick-answer li,
  .summary-box li {
    margin-bottom: 10px;
  }
  #intro p:first-child {
    font-size: 1.22rem;
    line-height: 1.7;
    padding-left: 20px;
    border-left: 4px solid var(--accent);
    color: #6a4215;
  }
  section[data-purpose] {
    padding: 22px 0 10px;
    border-top: 1px solid var(--border-soft);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 18px 0;
    background: var(--surface);
    border: 1px solid var(--border-soft);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: var(--shadow);
  }
  th, td {
    padding: 14px 16px;
    text-align: left;
    border-bottom: 1px solid var(--border-soft);
    font-size: 0.98rem;
  }
  th {
    background: #fff2d2;
    font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .faq-a { margin-top: 0; }
  #faq > div {
    padding: 18px 0;
    border-top: 1px solid var(--border-soft);
  }
  #cta p:first-child {
    font-size: 1.2rem;
    font-weight: 600;
    margin-top: 0;
  }
  #cta a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--accent);
    color: white;
    text-decoration: none;
    font-weight: 700;
    padding: 14px 20px;
    border-radius: 999px;
  }
  .related-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  .related-grid article {
    background: var(--surface);
    border: 1px solid var(--border-soft);
    border-radius: 16px;
    padding: 18px;
    box-shadow: var(--shadow);
  }
  .citations {
    display: inline-flex;
    gap: 4px;
    margin-left: 4px;
  }
  .citation a {
    text-decoration: none;
    color: var(--accent-dark);
    font: 700 0.72rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .sr-only.skip-link {
    position: absolute;
    left: -9999px;
    top: auto;
  }
  .sr-only.skip-link:focus {
    left: 16px;
    top: 16px;
    padding: 10px 14px;
    background: white;
    border: 1px solid var(--border);
    border-radius: 999px;
    z-index: 1000;
  }
  @media (max-width: 840px) {
    .site-shell { padding: 0 16px 48px; }
    .topbar { flex-wrap: wrap; }
    .nav-links { gap: 16px; flex-wrap: wrap; }
    .related-grid { grid-template-columns: 1fr; }
  }`;
}

export function buildBlogJsonLd(
  input: BlogWriterRequest,
  draft: BlogDraft
): Record<string, unknown> {
  const siteUrl = normalizeDomain(input.brand.domain);
  const canonicalUrl = `${siteUrl}/${draft.slug}`.replace(/([^:]\/)\/+/g, "$1");
  const publishedIso = input.article.published_at ?? new Date().toISOString();
  const modifiedIso = input.article.modified_at ?? publishedIso;
  const heroImageUrl =
    input.article.hero_image_url ?? `${siteUrl}/images/blog/${draft.slug}-hero.png`;
  const heroImageAlt =
    input.article.hero_image_alt ?? `${draft.title} hero image for ${input.brand.name}`;
  const wordCount = countWords(draft);
  const citationGraph = input.sources.map((source) => ({
    "@type": "CreativeWork",
    "@id": `${canonicalUrl}#source-${source.id}`,
    headline: source.title,
    url: source.url,
    publisher: source.publisher,
    author: source.author,
    datePublished: source.published_at,
    text: source.excerpt,
  }));

  const graph: Array<Record<string, unknown>> = [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: input.brand.name,
      url: siteUrl,
      description: input.brand.product_description,
      founder: input.brand.founder
        ? {
            "@type": "Person",
            name: input.brand.founder,
          }
        : undefined,
      sameAs: input.brand.twitter_handle
        ? [`https://twitter.com/${input.brand.twitter_handle.replace(/^@/, "")}`]
        : undefined,
    },
    {
      "@type": "WebPage",
      "@id": `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: draft.title,
      description: draft.meta_description,
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: [".quick-answer", ".summary-box", ".faq-a"],
      },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${canonicalUrl}#breadcrumbs`,
      itemListElement: draft.breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
        item: normalizeUrl(siteUrl, item.url),
      })),
    },
    {
      "@type": "BlogPosting",
      "@id": `${canonicalUrl}#article`,
      mainEntityOfPage: canonicalUrl,
      headline: draft.title,
      alternativeHeadline: draft.meta_title,
      description: draft.meta_description,
      abstract: draft.excerpt,
      url: canonicalUrl,
      datePublished: publishedIso,
      dateModified: modifiedIso,
      // Rich Person schema with sameAs for E-E-A-T (Google Helpful Content System)
      author: input.author
        ? {
            "@type": "Person",
            "@id": `${canonicalUrl}#author`,
            name: input.author.name,
            jobTitle: input.author.title,
            description: input.author.bio,
            image: input.author.avatar_url,
            sameAs: [
              input.author.linkedin_url,
              ...(input.author.twitter_url ? [input.author.twitter_url] : []),
            ].filter(Boolean),
            knowsAbout: input.author.expertise_keywords,
          }
        : {
            "@type": "Person",
            name: input.article.author_name,
          },
      // Editorial reviewer — required signal that the post was human-reviewed
      ...(input.reviewer
        ? {
            reviewedBy: {
              "@type": "Person",
              "@id": `${canonicalUrl}#reviewer`,
              name: input.reviewer.name,
              jobTitle: input.reviewer.title,
              description: input.reviewer.bio,
              sameAs: [input.reviewer.linkedin_url].filter(Boolean),
              knowsAbout: input.reviewer.expertise_keywords,
            },
          }
        : {}),
      publisher: {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: input.brand.name,
      },
      image: {
        "@type": "ImageObject",
        url: heroImageUrl,
        width: 1200,
        height: 630,
        caption: heroImageAlt,
      },
      articleSection: input.article.category,
      keywords: [input.primary_keyword, ...input.secondary_keywords],
      wordCount,
      inLanguage: "en-US",
      about: [
        {
          "@type": "Thing",
          name: input.topic,
        },
        ...input.brand.differentiators.map((item) => ({
          "@type": "Thing",
          name: item,
        })),
      ],
      mentions: [
        {
          "@type": "Organization",
          name: input.brand.name,
          url: siteUrl,
        },
        ...(input.brand.founder
          ? [
              {
                "@type": "Person",
                name: input.brand.founder,
              },
            ]
          : []),
        // Named examples become Organization mentions so AI engines understand
        // the article cites real, verifiable brands rather than generic references
        ...input.named_examples.map((ex) => ({
          "@type": "Organization" as const,
          name: ex.brand,
          ...(ex.source_url ? { url: ex.source_url } : {}),
        })),
      ],
      citation: citationGraph.map((citation) => ({ "@id": citation["@id"] })),
    },
  ];

  if (draft.faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${canonicalUrl}#faq`,
      mainEntity: draft.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    });
  }

  graph.push(...citationGraph);

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function renderBlogHtml(
  input: BlogWriterRequest,
  draft: BlogDraft,
  jsonLd: Record<string, unknown>
): string {
  const brandContext = loadBrandContext(input);
  const brandFacts = brandContext.facts;
  const siteUrl = normalizeDomain(input.brand.domain);
  const canonicalUrl = `${siteUrl}/${draft.slug}`.replace(/([^:]\/)\/+/g, "$1");
  const jsonLdString = JSON.stringify(jsonLd, null, 2);
  const publishedIso = input.article.published_at ?? new Date().toISOString();
  const modifiedIso = input.article.modified_at ?? publishedIso;
  const heroImageUrl =
    input.article.hero_image_url ?? `${siteUrl}/images/blog/${draft.slug}-hero.png`;
  const heroImageAlt =
    input.article.hero_image_alt ?? `${draft.title} hero image for ${input.brand.name}`;
  const readTime = estimateReadTime(countWords(draft));

  const breadcrumbs = draft.breadcrumbs
    .map(
      (item, index) =>
        `<li>${index < draft.breadcrumbs.length - 1 ? `<a href="${escapeHtml(item.url)}">${escapeHtml(item.label)}</a>` : `<span aria-current="page">${escapeHtml(item.label)}</span>`}</li>`
    )
    .join("");

  const quickAnswers = draft.quick_answer
    .map((item) => `<li>${renderRichText(item)}</li>`)
    .join("");

  const keyTakeaways = draft.key_takeaways
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  const sections = draft.sections
    .map((section) => {
      const paragraphs = section.paragraphs.map((paragraph) => renderParagraph(paragraph)).join("\n");
      const bullets = renderBulletsOrHtml(section.bullets);
      return `<section data-purpose="${escapeHtml(section.purpose)}">
  <h2>${escapeHtml(section.heading)}</h2>
  ${paragraphs}
  ${bullets}
</section>`;
    })
    .join("\n");

  const summaryBox = `<section class="summary-box" id="summary-box">
  <h2>Summary</h2>
  <ul>${draft.summary_box.map((item) => `<li>${renderRichText(item)}</li>`).join("")}</ul>
</section>`;

  const faq =
    draft.faq.length > 0
      ? `<section id="faq">
  <h2>Frequently asked questions</h2>
  ${draft.faq
    .map(
      (item) =>
        `<div data-faq-item="true">
  <h3>${escapeHtml(item.question)}</h3>
  ${renderFaqAnswer(item)}
</div>`
    )
    .join("\n")}
</section>`
      : "";

  const references = input.sources
    .map(
      (source) =>
        `<li id="source-${escapeHtml(source.id)}"><a href="${escapeHtml(source.url)}">${escapeHtml(source.title)}</a>${source.publisher ? `, ${escapeHtml(source.publisher)}` : ""}</li>`
    )
    .join("\n");

  const relatedArticles = `<section id="related-articles">
  <h2>Related articles</h2>
  <div class="related-grid">
    ${draft.suggested_internal_links
      .map(
        (link) =>
          `<article><h3><a href="${escapeHtml(link.url)}">${escapeHtml(link.anchor)}</a></h3><p>${escapeHtml(link.rationale)}</p></article>`
      )
      .join("\n")}
  </div>
</section>`;

  const cta = draft.call_to_action
    ? `<section id="cta">
  <p>${renderRichText(draft.call_to_action.text)}</p>
  <p><a href="${escapeHtml(draft.call_to_action.url)}">${escapeHtml(draft.call_to_action.label)}</a></p>
</section>`
    : "";

  // Editorial stance banner — renders the POV near the top so Google + LLMs
  // see the article takes a position (vs neutral AI summary)
  const editorialStanceBanner = input.editorial_stance
    ? `<aside class="editorial-stance" data-editorial="true" role="complementary">
  <p class="stance-label">Our take</p>
  <p class="stance-claim"><strong>${escapeHtml(input.editorial_stance.claim)}</strong></p>
  <p class="stance-reasoning">${escapeHtml(input.editorial_stance.supporting_reasoning)}</p>
</aside>`
    : "";

  // Author bio block at end of article for E-E-A-T authority
  const authorBio = renderAuthorBio(input.author);

  // ─── Editorial Integrity Checklist ──────────────────────────────────────
  // Visible block at the end of each article that documents which human
  // signals the post includes. Doubles as machine-readable metadata
  // (emitted as data-attributes) that the publish pipeline reads.
  const primaryCitationCount = input.sources.filter(
    (s) => s.authority_tier === "primary"
  ).length;
  const checklistItems: Array<{ id: string; label: string; pass: boolean; detail: string }> = [
    {
      id: "author",
      label: "Named author with LinkedIn",
      pass: Boolean(input.author?.linkedin_url),
      detail: input.author
        ? `${input.author.name}, ${input.author.title}`
        : "Missing",
    },
    {
      id: "reviewer",
      label: "Editorial reviewer",
      pass: Boolean(input.reviewer?.linkedin_url),
      detail: input.reviewer ? input.reviewer.name : "Not reviewed",
    },
    {
      id: "first_party_data",
      label: "First-party data",
      pass: input.first_party_data.length >= 1,
      detail: `${input.first_party_data.length} data point(s)`,
    },
    {
      id: "named_examples",
      label: "Named examples (3+)",
      pass: input.named_examples.length >= 3,
      detail: `${input.named_examples.length} brand(s): ${input.named_examples.slice(0, 3).map((e) => e.brand).join(", ")}`,
    },
    {
      id: "editorial_stance",
      label: "Editorial stance (POV)",
      pass: Boolean(input.editorial_stance),
      detail: input.editorial_stance
        ? `"${input.editorial_stance.claim.slice(0, 80)}${input.editorial_stance.claim.length > 80 ? "…" : ""}"`
        : "Missing",
    },
    {
      id: "original_visuals",
      label: "Original visuals (1+)",
      pass: input.original_visuals.length >= 1,
      detail: `${input.original_visuals.length} visual(s)`,
    },
    {
      id: "primary_citations",
      label: "Primary-tier citations (3+)",
      pass: primaryCitationCount >= 3,
      detail: `${primaryCitationCount} primary, ${input.sources.length - primaryCitationCount} other`,
    },
    {
      id: "refresh_commitment",
      label: "Refresh commitment",
      pass: Boolean(input.article.next_review_date) || true, // always renders a date (defaults to +90d)
      detail: `Next review ${input.article.next_review_date ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}`,
    },
  ];
  const checklistPassed = checklistItems.filter((i) => i.pass).length;
  const checklistTotal = checklistItems.length;
  const checklistBlock = input.enforce_human_signals
    ? `<section class="editorial-checklist" id="editorial-integrity" data-passed="${checklistPassed}" data-total="${checklistTotal}">
  <h2>Editorial integrity checklist</h2>
  <p class="checklist-lede">This article meets <strong>${checklistPassed} of ${checklistTotal}</strong> editorial signals that distinguish reviewed content from raw AI output. We publish this block so readers and search engines can verify what went into the post.</p>
  <ul class="checklist-items">
    ${checklistItems
      .map(
        (item) =>
          `<li class="checklist-item" data-item="${escapeHtml(item.id)}" data-pass="${item.pass}">
      <span class="check-icon" aria-hidden="true">${item.pass ? "✓" : "✗"}</span>
      <span class="check-label"><strong>${escapeHtml(item.label)}</strong> — <span class="check-detail">${escapeHtml(item.detail)}</span></span>
    </li>`
      )
      .join("\n    ")}
  </ul>
  <p class="checklist-note">Learn why these signals matter: Google's <a href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content">Helpful Content System</a> demotes pages that lack author E-E-A-T, first-party evidence, and original insight.</p>
</section>`
    : "";
  const navItems =
    brandFacts?.navigation?.map((item) => ({
      ...item,
      href:
        item.href.startsWith("#") || item.href.startsWith("/")
          ? item.href
          : normalizeUrl(siteUrl, item.href),
    })) ?? [
      { label: input.brand.name, href: "/", aria_label: `${input.brand.name} home` },
      { label: "Home", href: "/" },
      { label: "Blog", href: "/blog" },
      { label: "Guide", href: "/group-trip-planning-guide" },
      { label: "About", href: "/about" },
      { label: "Start planning", href: input.article.cta_url ?? "/start" },
    ];
  const footerItems =
    brandFacts?.footer_navigation ?? [
      { label: "About", href: "/about" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Contact", href: "/contact" },
      { label: "Guide", href: "/group-trip-planning-guide" },
    ];
  const supportEmail = brandFacts?.support_email ?? "support@jointryps.com";

  return `<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(draft.meta_title)}</title>
  <meta name="description" content="${escapeHtml(draft.meta_description)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="${escapeHtml(draft.meta_title)}">
  <meta property="og:description" content="${escapeHtml(draft.meta_description)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:image" content="${escapeHtml(heroImageUrl)}">
  <meta property="og:image:alt" content="${escapeHtml(heroImageAlt)}">
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:site" content="${escapeHtml(input.brand.twitter_handle ?? "@trypsapp")}">
  <meta property="twitter:title" content="${escapeHtml(draft.meta_title)}">
  <meta property="twitter:description" content="${escapeHtml(draft.meta_description)}">
  <meta property="twitter:image" content="${escapeHtml(heroImageUrl)}">
  <meta property="twitter:image:alt" content="${escapeHtml(heroImageAlt)}">
  <meta property="article:published_time" content="${escapeHtml(publishedIso)}">
  <meta property="article:modified_time" content="${escapeHtml(modifiedIso)}">
  <meta property="article:section" content="${escapeHtml(input.article.category)}">
  <style>${buildPreviewStyles()}</style>
  <script type="application/ld+json">${escapeHtml(jsonLdString)}</script>
</head>
<body>
  <a class="sr-only skip-link" href="#main-content">Skip to content</a>
  <div class="site-shell">
  <div class="topbar">
    <a class="brand" href="${escapeHtml(navItems[0]?.href ?? "/")}"${navItems[0]?.aria_label ? ` aria-label="${escapeHtml(navItems[0].aria_label)}"` : ""}>${escapeHtml(input.brand.name)}</a>
    <nav class="nav-links" aria-label="Primary">
      ${navItems
        .slice(1)
        .map((item, index, arr) =>
          index === arr.length - 1
            ? `<a class="nav-cta" href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`
            : `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`
        )
        .join("")}
    </nav>
  </div>
  <article class="page" data-primary-keyword="${escapeHtml(input.primary_keyword)}" data-search-intent="${escapeHtml(input.search_intent)}">
    <nav aria-label="Breadcrumb">
      <ol>${breadcrumbs}</ol>
    </nav>
    <header>
      <p class="category-badge">${escapeHtml(input.article.category)}</p>
      <h1>${escapeHtml(draft.title)}</h1>
      ${renderHeaderByline({
        author: input.author,
        fallbackAuthorName: input.article.author_name,
        reviewer: input.reviewer,
        publishedIso,
        modifiedIso,
        nextReviewIso: input.article.next_review_date,
        readTime,
      })}
      <p>${escapeHtml(draft.excerpt)}</p>
      <figure>
        <img src="${escapeHtml(heroImageUrl)}" alt="${escapeHtml(heroImageAlt)}" width="1200" height="630">
      </figure>
    </header>
    <main id="main-content">
      <section class="quick-answer" id="quick-answer">
        <h2>Quick answer</h2>
        <ul>${quickAnswers}</ul>
      </section>
      <section id="intro">
        ${draft.intro.map((paragraph) => renderParagraph(paragraph)).join("\n")}
      </section>
      <section id="key-takeaways">
        <h2>Key takeaways</h2>
        <ul>${keyTakeaways}</ul>
      </section>
      ${editorialStanceBanner}
      ${sections}
      ${summaryBox}
      ${faq}
      <section id="conclusion">
        <h2>Conclusion</h2>
        ${draft.conclusion.map((paragraph) => renderParagraph(paragraph)).join("\n")}
      </section>
      ${cta}
      ${authorBio}
      ${checklistBlock}
      ${relatedArticles}
      <section id="references">
        <h2>References</h2>
        <ol>
          ${references}
        </ol>
      </section>
    </main>
  </article>
  <footer>
    <nav aria-label="Footer navigation">
      ${footerItems
        .map((item) => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`)
        .join("")}
    </nav>
    <p>${escapeHtml(brandFacts?.product_summary ?? `${input.brand.name} helps friends plan trips together, lock dates, build itineraries, and split expenses.`)}</p>
    <p>Support: <a href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a></p>
    <p>&copy; ${escapeHtml(input.brand.name)}</p>
  </footer>
  </div>
</body>
</html>`;
}

export function buildBlogPackageFromDraft(
  input: BlogWriterRequest,
  draft: BlogDraft
): BlogWriterResponse {
  const enrichedInput = applyBrandContext(input);
  const normalized = normalizeDraftAgainstSources(
    draft,
    enrichedInput.sources,
    enrichedInput.article.slug
  );
  const json_ld = buildBlogJsonLd(enrichedInput, normalized.draft);
  const html = renderBlogHtml(enrichedInput, normalized.draft, json_ld);
  const canonical_url = `${normalizeDomain(enrichedInput.brand.domain)}/${normalized.draft.slug}`.replace(
    /([^:]\/)\/+/g,
    "$1"
  );

  // Calculate human-signal metrics for the response
  const primarySourceCount = enrichedInput.sources.filter(
    (s) => s.authority_tier === "primary"
  ).length;

  // Detect unreplaced visual placeholders in the final HTML
  const pendingVisuals: string[] = [];
  const visualMatches = html.match(/data-visual-id="([A-Z0-9-]+)"/g) ?? [];
  for (const m of visualMatches) {
    const id = m.match(/"([A-Z0-9-]+)"/)?.[1];
    if (id) pendingVisuals.push(id);
  }

  // Flag human-signal gaps so the pipeline knows when a post is safe to publish
  const signalGaps: string[] = [];
  if (enrichedInput.enforce_human_signals) {
    if (!enrichedInput.author) signalGaps.push("author entity missing");
    if (enrichedInput.first_party_data.length < 1)
      signalGaps.push("no first-party data");
    if (enrichedInput.named_examples.length < 3)
      signalGaps.push("fewer than 3 named examples");
    if (!enrichedInput.editorial_stance)
      signalGaps.push("no editorial stance");
    if (enrichedInput.original_visuals.length < 1)
      signalGaps.push("no original visuals");
    if (primarySourceCount < 3)
      signalGaps.push(`only ${primarySourceCount} primary-tier sources (need 3)`);
    if (pendingVisuals.length > 0)
      signalGaps.push(`${pendingVisuals.length} visual placeholder(s) need replacement`);
    // Check that stance was actually restated in the body
    if (enrichedInput.editorial_stance && !normalized.draft.stance_in_body) {
      signalGaps.push("editorial stance not restated in body");
    }
    // Check that FPD anchors are present
    if (
      enrichedInput.first_party_data.length > 0 &&
      normalized.draft.first_party_data_anchors.length === 0
    ) {
      signalGaps.push("first-party data anchors not recorded");
    }
  }

  // Build machine-readable editorial integrity checklist from the same signals
  // used to render the visible HTML block. Publishers can gate on this.
  const editorial_checklist = [
    {
      id: "author",
      label: "Named author with LinkedIn",
      pass: Boolean(enrichedInput.author?.linkedin_url),
      detail: enrichedInput.author
        ? `${enrichedInput.author.name}, ${enrichedInput.author.title}`
        : "Missing",
    },
    {
      id: "reviewer",
      label: "Editorial reviewer",
      pass: Boolean(enrichedInput.reviewer?.linkedin_url),
      detail: enrichedInput.reviewer ? enrichedInput.reviewer.name : "Not reviewed",
    },
    {
      id: "first_party_data",
      label: "First-party data point(s)",
      pass: enrichedInput.first_party_data.length >= 1,
      detail: `${enrichedInput.first_party_data.length} point(s)`,
    },
    {
      id: "named_examples",
      label: "Named examples (3+)",
      pass: enrichedInput.named_examples.length >= 3,
      detail: `${enrichedInput.named_examples.length} brand(s)`,
    },
    {
      id: "editorial_stance",
      label: "Editorial stance",
      pass: Boolean(enrichedInput.editorial_stance),
      detail: enrichedInput.editorial_stance?.claim.slice(0, 80) ?? "Missing",
    },
    {
      id: "original_visuals",
      label: "Original visuals (1+)",
      pass:
        enrichedInput.original_visuals.length >= 1 && pendingVisuals.length === 0,
      detail: `${enrichedInput.original_visuals.length} declared, ${pendingVisuals.length} pending replacement`,
    },
    {
      id: "primary_citations",
      label: "Primary-tier citations (3+)",
      pass: primarySourceCount >= 3,
      detail: `${primarySourceCount} primary / ${enrichedInput.sources.length} total`,
    },
    {
      id: "refresh_commitment",
      label: "Next review date set",
      pass: true, // always emitted (defaults to +90d)
      detail:
        enrichedInput.article.next_review_date ??
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    },
    {
      id: "stance_in_body",
      label: "Editorial stance restated in body",
      pass:
        !enrichedInput.editorial_stance || Boolean(normalized.draft.stance_in_body),
      detail: normalized.draft.stance_in_body?.slice(0, 80) ?? "N/A",
    },
    {
      id: "fpd_anchored",
      label: "First-party data anchored to sections",
      pass:
        enrichedInput.first_party_data.length === 0 ||
        normalized.draft.first_party_data_anchors.length > 0,
      detail: normalized.draft.first_party_data_anchors.join(" | ") || "N/A",
    },
  ];
  const checklist_passed = editorial_checklist.filter((c) => c.pass).length;
  const checklist_total = editorial_checklist.length;
  const publish_ready =
    enrichedInput.enforce_human_signals
      ? signalGaps.length === 0 && pendingVisuals.length === 0
      : true;

  return {
    request: {
      topic: enrichedInput.topic,
      primary_keyword: enrichedInput.primary_keyword,
      secondary_keywords: enrichedInput.secondary_keywords,
      search_intent: enrichedInput.search_intent,
      brand_name: enrichedInput.brand.name,
      canonical_url,
      source_count: enrichedInput.sources.length,
      human_signals_enforced: enrichedInput.enforce_human_signals,
      primary_source_count: primarySourceCount,
      first_party_data_count: enrichedInput.first_party_data.length,
      named_examples_count: enrichedInput.named_examples.length,
      original_visuals_count: enrichedInput.original_visuals.length,
      has_editorial_stance: Boolean(enrichedInput.editorial_stance),
      has_author_entity: Boolean(enrichedInput.author),
    },
    article: normalized.draft,
    html,
    preview_html: html,
    json_ld,
    json_ld_string: JSON.stringify(json_ld, null, 2),
    references: input.sources,
    validation: {
      warnings: normalized.warnings,
      uncited_source_ids: normalized.uncited_source_ids,
      human_signal_gaps: signalGaps,
      pending_visual_placements: pendingVisuals,
    },
    editorial_checklist,
    checklist_passed,
    checklist_total,
    publish_ready,
  };
}

export async function generateBlogPackage(
  rawInput: unknown
): Promise<BlogWriterResponse> {
  const input = applyBrandContext(BlogWriterRequestSchema.parse(rawInput));
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not set");
  }

  const client = new OpenAI({ apiKey });
  const prompt = buildPrompt(input);

  const response = await client.responses.create({
    model: input.model,
    input: prompt,
  });

  const rawText = collectTextFromOpenAI(response);
  const jsonText = extractJsonObject(rawText);
  if (!jsonText) {
    throw new Error("Model response did not contain a valid JSON object");
  }

  const parsedDraft = BlogDraftSchema.parse(JSON.parse(jsonText));
  return buildBlogPackageFromDraft(input, parsedDraft);
}

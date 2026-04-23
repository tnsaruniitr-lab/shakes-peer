import { parse, type HTMLElement } from "node-html-parser";
import type { BloggerPost, AuditOptions } from "blog-buster";
import type {
  BlogWriterRequest,
  BlogWriterResponse,
} from "./types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Shakes-peer ↔ Blog-buster adapter (Phase 0 / Phase 1 of the handshake).
//
// Transforms a Shakes-peer BlogWriterResponse into a blog-buster BloggerPost,
// and produces a fully-configured AuditOptions object ready for audit().
//
// The adapter is a pure function: same inputs → same outputs. It never reads
// from disk, never calls the network, never depends on process state.
//
// Three extract helpers do the heavy lifting:
//   - extractArticleBody(html)  → inner <article> or <main> HTML
//   - extractMetaTags(html)     → flat record of og:*, twitter:*, meta name/*
//   - unwrapJsonLdGraph(json)   → @graph array or wrapped { @graph } → flat unknown[]
//
// Contract ref: docs/handshake-contract.md §5 (request), §7 (fix plan).
// ─────────────────────────────────────────────────────────────────────────────

export interface AdapterInput {
  request: BlogWriterRequest;
  response: BlogWriterResponse;
}

export interface BuildAuditOptionsInput extends AdapterInput {
  repoRoot: string;
  outputDir: string;
  runLlmLayers?: boolean;
  targetScore?: number;
}

/**
 * Convert a Shakes-peer writer response into a blog-buster BloggerPost.
 * Deterministic. Does not mutate inputs.
 */
export function toBloggerPost(input: AdapterInput): BloggerPost {
  const { request, response } = input;
  const html = response.html;
  return {
    slug: response.article.slug,
    brand: {
      name: request.brand.name,
      website: ensureUrl(request.brand.domain),
    },
    html,
    articleBodyHtml: extractArticleBody(html),
    jsonLdSchemas: unwrapJsonLdGraph(response.json_ld),
    metaTags: extractMetaTags(html),
    topic: request.topic,
    primaryKeyword: request.primary_keyword,
    secondaryKeywords: request.secondary_keywords,
    format: normalizeFormatHint(request.post_format ?? response.article.format),
    wordCount: computeWordCount(response),
  };
}

/**
 * Build a fully-configured AuditOptions object. Enforces the handshake
 * filesystem policy (§11): blog-buster only writes to the provided
 * outputDir; no Desktop publishing, no repo publishing, no git commits.
 */
export function buildAuditOptions(input: BuildAuditOptionsInput): AuditOptions {
  return {
    generatedPost: toBloggerPost(input),
    runLlmLayers: input.runLlmLayers ?? true,
    publishToLocal: false,
    publishToRepo: false,
    commit: false,
    repoRoot: input.repoRoot,
    outputDir: input.outputDir,
    targetScore: input.targetScore ?? 90,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Extract the inner HTML of the first <article> or <main> element.
 * Falls back to the whole document if neither is present, which matches
 * blog-buster's own fallback behavior (it treats full html as body).
 */
export function extractArticleBody(html: string): string {
  const root = parse(html);
  const article = root.querySelector("article");
  if (article) return article.innerHTML;
  const main = root.querySelector("main");
  if (main) return main.innerHTML;
  const body = root.querySelector("body");
  if (body) return body.innerHTML;
  return html;
}

/**
 * Pull meta tags out of the HTML head into a flat { key: value } record.
 *
 * Keys follow blog-buster's convention (src/input/from-post-object.ts):
 *   - og:* and twitter:* and article:* are preserved verbatim
 *   - <meta name="X"> → "X"
 *   - <title> → "title"
 *   - <link rel="canonical"> → "canonical"
 *
 * This mirrors the flat-key shape blog-buster's flatten logic expects.
 */
export function extractMetaTags(html: string): Record<string, string> {
  const root = parse(html);
  const out: Record<string, string> = {};

  const titleEl = root.querySelector("title");
  if (titleEl?.text) out["title"] = titleEl.text.trim();

  const canonicalEl = root.querySelector('link[rel="canonical"]');
  const canonicalHref = canonicalEl?.getAttribute("href");
  if (canonicalHref) out["canonical"] = canonicalHref;

  for (const metaEl of root.querySelectorAll("meta")) {
    const content = metaEl.getAttribute("content");
    if (!content) continue;
    const property = metaEl.getAttribute("property");
    const name = metaEl.getAttribute("name");
    const httpEquiv = metaEl.getAttribute("http-equiv");
    const key = property ?? name ?? httpEquiv;
    if (!key) continue;
    // First wins — blog-buster's semantics: don't clobber with later duplicates.
    if (out[key] === undefined) out[key] = content;
  }

  return out;
}

/**
 * Unwrap Shakes-peer's JSON-LD @graph wrapper into a flat array.
 * Blog-buster expects jsonLdSchemas as unknown[] of individual entity
 * objects; our writer emits { "@context": ..., "@graph": [...] }.
 */
export function unwrapJsonLdGraph(
  jsonLd: Record<string, unknown> | unknown[] | null | undefined
): unknown[] {
  if (!jsonLd) return [];
  if (Array.isArray(jsonLd)) return jsonLd;
  if (typeof jsonLd !== "object") return [];

  const graph = (jsonLd as { "@graph"?: unknown })["@graph"];
  if (Array.isArray(graph)) {
    // Propagate @context down to each node so each entity is independently valid
    // (blog-buster checks @type on each entity in the flat array).
    const context = (jsonLd as { "@context"?: unknown })["@context"];
    return graph.map((node) =>
      context && typeof node === "object" && node !== null && !(node as Record<string, unknown>)["@context"]
        ? { "@context": context, ...(node as Record<string, unknown>) }
        : node
    );
  }

  // Single entity passed without a graph wrapper → wrap into an array.
  if ((jsonLd as Record<string, unknown>)["@type"]) {
    return [jsonLd];
  }

  return [];
}

// ─── Internal utilities ──────────────────────────────────────────────────────

function ensureUrl(domain: string): string {
  if (!domain) return "";
  if (domain.startsWith("http://") || domain.startsWith("https://")) {
    return domain.replace(/\/+$/, "");
  }
  return `https://${domain.replace(/\/+$/, "")}`;
}

/**
 * Map BlogPostFormat enum values to blog-buster's format hints.
 * Blog-buster uses format for post-type inference; we keep the enum values
 * compatible and let blog-buster fall back to topic/heuristics when unset.
 */
function normalizeFormatHint(format: string | undefined): string | undefined {
  if (!format) return undefined;
  const map: Record<string, string> = {
    destination_guide: "guide",
    how_to: "how-to",
    comparison: "comparison",
    listicle: "listicle",
    article: "article",
  };
  return map[format] ?? format;
}

function computeWordCount(response: BlogWriterResponse): number {
  const draft = response.article;
  const chunks: string[] = [];
  for (const p of draft.intro) chunks.push(p.text);
  for (const s of draft.sections) {
    chunks.push(s.heading);
    for (const p of s.paragraphs) chunks.push(p.text);
    for (const b of s.bullets) chunks.push(b);
  }
  for (const f of draft.faq) {
    chunks.push(f.question, f.answer);
  }
  for (const p of draft.conclusion) chunks.push(p.text);
  return chunks.join(" ").trim().split(/\s+/).filter(Boolean).length;
}

// ─── Re-exports so callers don't need to import from blog-buster directly ───
export type { BloggerPost, AuditOptions } from "blog-buster";

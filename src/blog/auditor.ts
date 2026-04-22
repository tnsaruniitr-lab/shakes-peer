import { z } from "zod";
import {
  BlogDraftSchema,
  BlogSourceSchema,
  type BlogDraft,
  type BlogPostFormat,
  type BlogSource,
} from "./types.js";

const BlogAuditIterationSchema = z.object({
  label: z.string().optional(),
  previous_score: z.number().min(0).max(100),
  previous_failed_checks: z.array(z.string()).default([]),
  fixes_applied: z.array(z.string()).default([]),
});

const BlogAuditRequestSchema = z.object({
  topic: z.string().optional(),
  primary_keyword: z.string().optional(),
  secondary_keywords: z.array(z.string()).default([]),
  search_intent: z.string().optional(),
  brand_name: z.string().optional(),
  canonical_url: z.string().optional(),
  source_count: z.number().int().nonnegative().optional(),
});

export const BlogAuditInputSchema = z
  .object({
    request: BlogAuditRequestSchema.optional(),
    article: BlogDraftSchema.optional(),
    html: z.string().optional(),
    json_ld: z.record(z.unknown()).optional(),
    json_ld_string: z.string().optional(),
    references: z.array(BlogSourceSchema).default([]),
    validation: z
      .object({
        warnings: z.array(z.string()).default([]),
        uncited_source_ids: z.array(z.string()).default([]),
      })
      .optional(),
    iteration: BlogAuditIterationSchema.optional(),
  })
  .refine((value) => Boolean(value.article || value.html || value.json_ld || value.json_ld_string), {
    message: "At least one of article, html, json_ld, or json_ld_string is required",
  });

type AuditStatus = "pass" | "fail" | "na" | "unverifiable";

interface AuditCheckResult {
  id: string;
  label: string;
  status: AuditStatus;
  verification_method: string;
  evidence: string;
  exact_fix?: string;
}

interface AuditSectionResult {
  id: string;
  title: string;
  weight: number;
  score: number | null;
  applicable_checks: number;
  pass_count: number;
  fail_count: number;
  na_count: number;
  unverifiable_count: number;
  checks: AuditCheckResult[];
}

interface BlogAuditOutput {
  detected_format: {
    value: BlogPostFormat | "unknown";
    confidence: "high" | "medium" | "low";
    signals: string[];
  };
  input_coverage: {
    article: boolean;
    html: boolean;
    json_ld: boolean;
    references: boolean;
  };
  summary: {
    overall_score: number | null;
    rating: "Publish-ready" | "Minor fixes needed" | "Significant gaps" | "Major rework required" | "Insufficient input";
    score_delta_vs_previous: number | null;
    previously_failed_now_passing: string[];
    fixes_applied: string[];
  };
  sections: AuditSectionResult[];
  fix_summary: Array<{
    check_id: string;
    section_id: string;
    issue: string;
    exact_fix: string;
  }>;
}

type ParsedGraphNode = Record<string, unknown>;

interface AuditContext {
  input: z.infer<typeof BlogAuditInputSchema>;
  article?: BlogDraft;
  html?: string;
  jsonLd?: Record<string, unknown>;
  graphNodes: ParsedGraphNode[];
  request: z.infer<typeof BlogAuditRequestSchema>;
  references: BlogSource[];
  format: BlogPostFormat | "unknown";
  formatSignals: string[];
  formatConfidence: "high" | "medium" | "low";
  headings: string[];
  htmlIds: Set<string>;
  htmlAnchors: string[];
  primaryKeyword?: string;
  brandName?: string;
}

function safeJsonParse(value: string): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(value: string): number {
  const clean = stripHtml(value);
  if (!clean) {
    return 0;
  }
  return clean.split(/\s+/).length;
}

function getGraphNodes(jsonLd?: Record<string, unknown>): ParsedGraphNode[] {
  if (!jsonLd) {
    return [];
  }

  const graph = jsonLd["@graph"];
  if (Array.isArray(graph)) {
    return graph.filter((node): node is ParsedGraphNode => Boolean(node) && typeof node === "object");
  }

  return [jsonLd];
}

function getNodeTypes(node: ParsedGraphNode): string[] {
  const type = node["@type"];
  if (typeof type === "string") {
    return [type];
  }
  if (Array.isArray(type)) {
    return type.filter((item): item is string => typeof item === "string");
  }
  return [];
}

function findGraphNodeByType(nodes: ParsedGraphNode[], type: string): ParsedGraphNode | undefined {
  return nodes.find((node) => getNodeTypes(node).includes(type));
}

function extractHeadingsFromHtml(html?: string): string[] {
  if (!html) {
    return [];
  }

  const matches = html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi);
  return Array.from(matches, (match) => stripHtml(match[1] ?? ""));
}

function extractIdsFromHtml(html?: string): Set<string> {
  if (!html) {
    return new Set();
  }

  const matches = html.matchAll(/\sid="([^"]+)"/gi);
  return new Set(Array.from(matches, (match) => match[1] ?? "").filter(Boolean));
}

function extractAnchorsFromHtml(html?: string): string[] {
  if (!html) {
    return [];
  }

  const matches = html.matchAll(/\shref="#([^"]+)"/gi);
  return Array.from(matches, (match) => match[1] ?? "").filter(Boolean);
}

function detectFormat(
  article: BlogDraft | undefined,
  headings: string[],
  nodes: ParsedGraphNode[]
): Pick<AuditContext, "format" | "formatSignals" | "formatConfidence"> {
  const signals: string[] = [];

  if (article?.format) {
    signals.push(`article.format=${article.format}`);
    return {
      format: article.format,
      formatSignals: signals,
      formatConfidence: "high",
    };
  }

  if (findGraphNodeByType(nodes, "HowTo")) {
    signals.push("json-ld includes HowTo");
    return { format: "how_to", formatSignals: signals, formatConfidence: "high" };
  }

  const normalizedHeadings = headings.map(normalizeText);
  if (normalizedHeadings.some((heading) => heading.startsWith("how to "))) {
    signals.push("heading pattern suggests how-to");
    return { format: "how_to", formatSignals: signals, formatConfidence: "medium" };
  }

  if (normalizedHeadings.some((heading) => /\bvs\b|versus|compare|comparison/.test(heading))) {
    signals.push("heading pattern suggests comparison");
    return { format: "comparison", formatSignals: signals, formatConfidence: "medium" };
  }

  if (normalizedHeadings.some((heading) => /^\d+\b/.test(heading) || heading.includes("best "))) {
    signals.push("heading pattern suggests listicle");
    return { format: "listicle", formatSignals: signals, formatConfidence: "medium" };
  }

  if (findGraphNodeByType(nodes, "TouristDestination")) {
    signals.push("json-ld includes TouristDestination");
    return { format: "destination_guide", formatSignals: signals, formatConfidence: "medium" };
  }

  return {
    format: "article",
    formatSignals: signals.length > 0 ? signals : ["defaulted to generic article"],
    formatConfidence: signals.length > 0 ? "low" : "medium",
  };
}

function createContext(rawInput: unknown): AuditContext {
  const input = BlogAuditInputSchema.parse(rawInput);
  const jsonLd = input.json_ld ?? (input.json_ld_string ? safeJsonParse(input.json_ld_string) : undefined);
  const graphNodes = getGraphNodes(jsonLd);
  const headings = input.article
    ? [input.article.title, ...input.article.sections.map((section) => section.heading)]
    : extractHeadingsFromHtml(input.html);
  const detected = detectFormat(input.article, headings, graphNodes);

  return {
    input,
    article: input.article,
    html: input.html,
    jsonLd,
    graphNodes,
    request: input.request ?? { secondary_keywords: [] },
    references: input.references,
    headings,
    htmlIds: extractIdsFromHtml(input.html),
    htmlAnchors: extractAnchorsFromHtml(input.html),
    primaryKeyword: input.request?.primary_keyword,
    brandName: input.request?.brand_name,
    ...detected,
  };
}

function makeCheck(
  id: string,
  label: string,
  verification_method: string,
  evaluator: (context: AuditContext) => AuditCheckResult
): (context: AuditContext) => AuditCheckResult {
  return (context: AuditContext) => evaluator(context);
}

function fail(
  id: string,
  label: string,
  verification_method: string,
  evidence: string,
  exact_fix: string
): AuditCheckResult {
  return { id, label, verification_method, status: "fail", evidence, exact_fix };
}

function pass(
  id: string,
  label: string,
  verification_method: string,
  evidence: string
): AuditCheckResult {
  return { id, label, verification_method, status: "pass", evidence };
}

function unverifiable(
  id: string,
  label: string,
  verification_method: string,
  evidence: string
): AuditCheckResult {
  return { id, label, verification_method, status: "unverifiable", evidence };
}

function na(id: string, label: string, verification_method: string, evidence: string): AuditCheckResult {
  return { id, label, verification_method, status: "na", evidence };
}

const sectionDefinitions = [
  {
    id: "A",
    title: "Search Intent & On-Page SEO",
    weight: 20,
    checks: [
      makeCheck(
        "A1",
        "Primary keyword appears in the page title or H1",
        "Look at article.title or the first <h1> and compare it to request.primary_keyword.",
        (context) => {
          if (!context.primaryKeyword) {
            return unverifiable("A1", "Primary keyword appears in the page title or H1", "Look at article.title or the first <h1> and compare it to request.primary_keyword.", "Primary keyword was not provided.");
          }
          const title = context.article?.title ?? context.headings[0];
          if (!title) {
            return unverifiable("A1", "Primary keyword appears in the page title or H1", "Look at article.title or the first <h1> and compare it to request.primary_keyword.", "No title or H1 was provided.");
          }
          if (normalizeText(title).includes(normalizeText(context.primaryKeyword))) {
            return pass("A1", "Primary keyword appears in the page title or H1", "Look at article.title or the first <h1> and compare it to request.primary_keyword.", `Title/H1 contains "${context.primaryKeyword}".`);
          }
          return fail(
            "A1",
            "Primary keyword appears in the page title or H1",
            "Look at article.title or the first <h1> and compare it to request.primary_keyword.",
            `Current title/H1 is "${title}" and it does not include "${context.primaryKeyword}".`,
            `Change the title to include the primary keyword, for example: "${context.primaryKeyword} | ${title}".`
          );
        }
      ),
      makeCheck(
        "A2",
        "Meta title is keyword-aligned and within 45-65 characters",
        "Count article.meta_title characters and verify it includes request.primary_keyword or a close variant.",
        (context) => {
          const metaTitle = context.article?.meta_title;
          if (!metaTitle) {
            return unverifiable("A2", "Meta title is keyword-aligned and within 45-65 characters", "Count article.meta_title characters and verify it includes request.primary_keyword or a close variant.", "Meta title was not provided in the article payload.");
          }
          const length = metaTitle.length;
          const hasKeyword = context.primaryKeyword
            ? normalizeText(metaTitle).includes(normalizeText(context.primaryKeyword))
            : true;
          if (length >= 45 && length <= 65 && hasKeyword) {
            return pass("A2", "Meta title is keyword-aligned and within 45-65 characters", "Count article.meta_title characters and verify it includes request.primary_keyword or a close variant.", `Meta title is ${length} characters and keyword-aligned.`);
          }
          return fail(
            "A2",
            "Meta title is keyword-aligned and within 45-65 characters",
            "Count article.meta_title characters and verify it includes request.primary_keyword or a close variant.",
            `Meta title is ${length} characters: "${metaTitle}".`,
            `Replace meta_title with a 45-65 character version that includes the primary keyword, for example: "${context.primaryKeyword ?? metaTitle}".`
          );
        }
      ),
      makeCheck(
        "A3",
        "Meta description is specific and within 140-165 characters",
        "Count article.meta_description characters and check for concrete nouns or numbers, not empty hype.",
        (context) => {
          const metaDescription = context.article?.meta_description;
          if (!metaDescription) {
            return unverifiable("A3", "Meta description is specific and within 140-165 characters", "Count article.meta_description characters and check for concrete nouns or numbers, not empty hype.", "Meta description was not provided in the article payload.");
          }
          const length = metaDescription.length;
          const concrete = /\d|how|guide|compare|examples|steps|cost|tips|faq/i.test(metaDescription);
          if (length >= 140 && length <= 165 && concrete) {
            return pass("A3", "Meta description is specific and within 140-165 characters", "Count article.meta_description characters and check for concrete nouns or numbers, not empty hype.", `Meta description is ${length} characters and specific enough for SERP reuse.`);
          }
          return fail(
            "A3",
            "Meta description is specific and within 140-165 characters",
            "Count article.meta_description characters and check for concrete nouns or numbers, not empty hype.",
            `Meta description is ${length} characters: "${metaDescription}".`,
            `Replace meta_description with a 140-165 character summary that names the topic, outcome, and one concrete detail.`
          );
        }
      ),
      makeCheck(
        "A4",
        "Slug is concise and keyword-relevant",
        "Check article.slug against request.primary_keyword and keep it under 80 characters.",
        (context) => {
          const slug = context.article?.slug;
          if (!slug) {
            return unverifiable("A4", "Slug is concise and keyword-relevant", "Check article.slug against request.primary_keyword and keep it under 80 characters.", "Slug was not provided in the article payload.");
          }
          const concise = slug.length <= 80;
          const aligned = context.primaryKeyword
            ? normalizeText(slug.replaceAll("-", " ")).includes(normalizeText(context.primaryKeyword))
            : true;
          if (concise && aligned) {
            return pass("A4", "Slug is concise and keyword-relevant", "Check article.slug against request.primary_keyword and keep it under 80 characters.", `Slug "${slug}" is concise and aligned.`);
          }
          return fail(
            "A4",
            "Slug is concise and keyword-relevant",
            "Check article.slug against request.primary_keyword and keep it under 80 characters.",
            `Slug "${slug}" is either too long or not aligned to the primary keyword.`,
            `Replace slug with a short keyword-led slug such as "${(context.primaryKeyword ?? slug).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}".`
          );
        }
      ),
      makeCheck(
        "A5",
        "The article body has enough topical depth",
        "Count section blocks and total visible words across article text or HTML.",
        (context) => {
          const sectionCount = context.article?.sections.length ?? (context.html?.match(/<section\b/gi)?.length ?? 0);
          const wordCount = context.article
            ? countWords(
                [
                  ...context.article.intro.map((item) => item.text),
                  ...context.article.sections.flatMap((section) => section.paragraphs.map((paragraph) => paragraph.text)),
                  ...context.article.conclusion.map((item) => item.text),
                  ...context.article.faq.map((item) => `${item.question} ${item.answer}`),
                ].join(" ")
              )
            : countWords(context.html ?? "");
          if (!sectionCount || wordCount === 0) {
            return unverifiable("A5", "The article body has enough topical depth", "Count section blocks and total visible words across article text or HTML.", "Not enough article or HTML content was provided to measure body depth.");
          }
          if (sectionCount >= 3 && wordCount >= 700) {
            return pass("A5", "The article body has enough topical depth", "Count section blocks and total visible words across article text or HTML.", `Detected ${sectionCount} sections and about ${wordCount} words.`);
          }
          return fail(
            "A5",
            "The article body has enough topical depth",
            "Count section blocks and total visible words across article text or HTML.",
            `Detected ${sectionCount} sections and about ${wordCount} words.`,
            "Add at least 3 substantive sections and expand the body to roughly 700+ words with source-backed explanations, examples, or comparisons."
          );
        }
      ),
    ],
  },
  {
    id: "B",
    title: "Answer Extraction & Engagement",
    weight: 20,
    checks: [
      makeCheck(
        "B1",
        "The post includes a fast-answer block near the top",
        "Check article.quick_answer or an equivalent early answer block in the first 20% of HTML.",
        (context) => {
          const quickAnswer = context.article?.quick_answer ?? [];
          if (!context.article && !context.html) {
            return unverifiable("B1", "The post includes a fast-answer block near the top", "Check article.quick_answer or an equivalent early answer block in the first 20% of HTML.", "No article or HTML was provided.");
          }
          if (quickAnswer.length >= 3) {
            return pass("B1", "The post includes a fast-answer block near the top", "Check article.quick_answer or an equivalent early answer block in the first 20% of HTML.", `Article includes ${quickAnswer.length} quick-answer bullets.`);
          }
          const htmlHasTakeawayBlock = /id="key-takeaways"|quick answer|summary/i.test(context.html ?? "");
          if (htmlHasTakeawayBlock) {
            return pass("B1", "The post includes a fast-answer block near the top", "Check article.quick_answer or an equivalent early answer block in the first 20% of HTML.", "HTML includes an answer-style summary block.");
          }
          return fail(
            "B1",
            "The post includes a fast-answer block near the top",
            "Check article.quick_answer or an equivalent early answer block in the first 20% of HTML.",
            "No clear quick-answer block was detected near the top of the post.",
            'Add `quick_answer` with 3-5 direct bullets that answer the primary query in plain language before the main body.'
          );
        }
      ),
      makeCheck(
        "B2",
        "Headings are question-led or snippet-friendly",
        "Review section headings for question, comparison, or answer-led phrasing.",
        (context) => {
          const headings = context.article?.sections.map((section) => section.heading) ?? context.headings.slice(1);
          if (headings.length === 0) {
            return unverifiable("B2", "Headings are question-led or snippet-friendly", "Review section headings for question, comparison, or answer-led phrasing.", "No section headings were available.");
          }
          const strongHeadings = headings.filter((heading) =>
            /\?|^how\b|^what\b|^why\b|^when\b|^which\b|^best\b|^steps?\b|^compare\b/i.test(
              heading.trim()
            )
          ).length;
          if (strongHeadings >= Math.max(2, Math.ceil(headings.length / 3))) {
            return pass("B2", "Headings are question-led or snippet-friendly", "Review section headings for question, comparison, or answer-led phrasing.", `${strongHeadings} of ${headings.length} headings are answer-oriented.`);
          }
          return fail(
            "B2",
            "Headings are question-led or snippet-friendly",
            "Review section headings for question, comparison, or answer-led phrasing.",
            `${strongHeadings} of ${headings.length} headings are answer-oriented.`,
            `Rewrite section headings into query-led headings such as "What is ${context.primaryKeyword ?? "the main topic"}?" or "How does it work?".`
          );
        }
      ),
      makeCheck(
        "B3",
        "The post includes reader-retention elements",
        "Check for key takeaways, summary box, bullets, FAQ, or comparison structures.",
        (context) => {
          const article = context.article;
          if (!article && !context.html) {
            return unverifiable("B3", "The post includes reader-retention elements", "Check for key takeaways, summary box, bullets, FAQ, or comparison structures.", "No article or HTML was provided.");
          }
          const signals = [
            article?.key_takeaways.length ? "key_takeaways" : "",
            article?.summary_box.length ? "summary_box" : "",
            article?.faq.length ? "faq" : "",
            article?.sections.some((section) => section.bullets.length > 0) ? "bullets" : "",
            /<table\b/i.test(context.html ?? "") ? "table" : "",
          ].filter(Boolean);
          if (signals.length >= 3) {
            return pass("B3", "The post includes reader-retention elements", "Check for key takeaways, summary box, bullets, FAQ, or comparison structures.", `Detected retention elements: ${signals.join(", ")}.`);
          }
          return fail(
            "B3",
            "The post includes reader-retention elements",
            "Check for key takeaways, summary box, bullets, FAQ, or comparison structures.",
            `Detected only ${signals.length} retention elements: ${signals.join(", ") || "none"}.`,
            "Add at least three engagement structures such as `key_takeaways`, `summary_box`, FAQ, bullets, or a comparison table."
          );
        }
      ),
      makeCheck(
        "B4",
        "Paragraphs are concise enough for AI extraction",
        "Measure average paragraph length in article paragraphs or HTML <p> tags.",
        (context) => {
          const paragraphs = context.article
            ? [
                ...context.article.intro.map((item) => item.text),
                ...context.article.sections.flatMap((section) => section.paragraphs.map((paragraph) => paragraph.text)),
                ...context.article.conclusion.map((item) => item.text),
                ...context.article.faq.map((item) => item.answer),
              ]
            : Array.from((context.html ?? "").matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi), (match) =>
                stripHtml(match[1] ?? "")
              ).filter(Boolean);
          if (paragraphs.length === 0) {
            return unverifiable("B4", "Paragraphs are concise enough for AI extraction", "Measure average paragraph length in article paragraphs or HTML <p> tags.", "No paragraphs were available for measurement.");
          }
          const avgWords = Math.round(
            paragraphs.reduce((sum, paragraph) => sum + countWords(paragraph), 0) / paragraphs.length
          );
          if (avgWords <= 85) {
            return pass("B4", "Paragraphs are concise enough for AI extraction", "Measure average paragraph length in article paragraphs or HTML <p> tags.", `Average paragraph length is about ${avgWords} words.`);
          }
          return fail(
            "B4",
            "Paragraphs are concise enough for AI extraction",
            "Measure average paragraph length in article paragraphs or HTML <p> tags.",
            `Average paragraph length is about ${avgWords} words.`,
            "Split long paragraphs so most answer blocks stay under 85 words and put one core idea in each paragraph."
          );
        }
      ),
      makeCheck(
        "B5",
        "A clear next step or CTA is present",
        "Check article.call_to_action or a dedicated CTA block in HTML.",
        (context) => {
          const cta = context.article?.call_to_action;
          if (cta?.label && cta.url && cta.text) {
            return pass("B5", "A clear next step or CTA is present", "Check article.call_to_action or a dedicated CTA block in HTML.", `CTA detected with label "${cta.label}".`);
          }
          if (/id="cta"|call to action/i.test(context.html ?? "")) {
            return pass("B5", "A clear next step or CTA is present", "Check article.call_to_action or a dedicated CTA block in HTML.", "CTA block detected in HTML.");
          }
          return fail(
            "B5",
            "A clear next step or CTA is present",
            "Check article.call_to_action or a dedicated CTA block in HTML.",
            "No clear CTA or next-step block was detected.",
            'Add `call_to_action` with `label`, `url`, and one sentence explaining the next action the reader should take.'
          );
        }
      ),
    ],
  },
  {
    id: "C",
    title: "HTML Structure & UX Signals",
    weight: 20,
    checks: [
      makeCheck(
        "C1",
        "HTML contains one semantic <article> root and exactly one <h1>",
        "Count <article> and <h1> tags in the HTML.",
        (context) => {
          if (!context.html) {
            return unverifiable("C1", "HTML contains one semantic <article> root and exactly one <h1>", "Count <article> and <h1> tags in the HTML.", "HTML was not provided.");
          }
          const articleCount = context.html.match(/<article\b/gi)?.length ?? 0;
          const h1Count = context.html.match(/<h1\b/gi)?.length ?? 0;
          if (articleCount === 1 && h1Count === 1) {
            return pass("C1", "HTML contains one semantic <article> root and exactly one <h1>", "Count <article> and <h1> tags in the HTML.", "HTML contains one <article> root and one <h1>.");
          }
          return fail(
            "C1",
            "HTML contains one semantic <article> root and exactly one <h1>",
            "Count <article> and <h1> tags in the HTML.",
            `Detected ${articleCount} <article> tags and ${h1Count} <h1> tags.`,
            "Render a single `<article>` wrapper and keep exactly one `<h1>` for the page title."
          );
        }
      ),
      makeCheck(
        "C2",
        "Heading hierarchy is clean",
        "Verify the page starts with <h1>, uses <h2> for main sections, and does not jump to <h4+>.",
        (context) => {
          if (!context.html) {
            return unverifiable("C2", "Heading hierarchy is clean", "Verify the page starts with <h1>, uses <h2> for main sections, and does not jump to <h4+>.", "HTML was not provided.");
          }
          const headingTags = Array.from(context.html.matchAll(/<(h[1-6])\b/gi), (match) =>
            (match[1] ?? "").toLowerCase()
          );
          const firstHeading = headingTags[0];
          const hasDeepJump = headingTags.some((tag) => ["h4", "h5", "h6"].includes(tag));
          if (firstHeading === "h1" && !hasDeepJump) {
            return pass("C2", "Heading hierarchy is clean", "Verify the page starts with <h1>, uses <h2> for main sections, and does not jump to <h4+>.", `Heading order starts with ${firstHeading} and avoids deep heading jumps.`);
          }
          return fail(
            "C2",
            "Heading hierarchy is clean",
            "Verify the page starts with <h1>, uses <h2> for main sections, and does not jump to <h4+>.",
            `Heading order begins with ${firstHeading ?? "none"} and deep heading tags are ${hasDeepJump ? "present" : "not present"}.`,
            "Normalize the markup so the page starts with `<h1>`, main sections use `<h2>`, and deeper headings only appear when nested content truly requires them."
          );
        }
      ),
      makeCheck(
        "C3",
        "Inline citation anchors resolve to reference targets",
        "Compare href=\"#source-*\" anchors against matching id attributes in the references list.",
        (context) => {
          if (!context.html) {
            return unverifiable("C3", "Inline citation anchors resolve to reference targets", "Compare href=\"#source-*\" anchors against matching id attributes in the references list.", "HTML was not provided.");
          }
          const missing = context.htmlAnchors.filter((anchor) => !context.htmlIds.has(anchor));
          if (missing.length === 0) {
            return pass("C3", "Inline citation anchors resolve to reference targets", "Compare href=\"#source-*\" anchors against matching id attributes in the references list.", `All ${context.htmlAnchors.length} citation anchors resolve.`);
          }
          return fail(
            "C3",
            "Inline citation anchors resolve to reference targets",
            "Compare href=\"#source-*\" anchors against matching id attributes in the references list.",
            `Missing reference targets for: ${missing.join(", ")}.`,
            `Add matching reference elements with ids ${missing.map((id) => `"${id}"`).join(", ")} or update the broken citation href values to existing ids.`
          );
        }
      ),
      makeCheck(
        "C4",
        "Primary keyword and intent are embedded as machine-readable HTML attributes",
        "Look for data-primary-keyword and data-search-intent on the root article element.",
        (context) => {
          if (!context.html) {
            return unverifiable("C4", "Primary keyword and intent are embedded as machine-readable HTML attributes", "Look for data-primary-keyword and data-search-intent on the root article element.", "HTML was not provided.");
          }
          const hasPrimary = /data-primary-keyword="[^"]+"/i.test(context.html);
          const hasIntent = /data-search-intent="[^"]+"/i.test(context.html);
          if (hasPrimary && hasIntent) {
            return pass("C4", "Primary keyword and intent are embedded as machine-readable HTML attributes", "Look for data-primary-keyword and data-search-intent on the root article element.", "Root article element includes both keyword and intent attributes.");
          }
          return fail(
            "C4",
            "Primary keyword and intent are embedded as machine-readable HTML attributes",
            "Look for data-primary-keyword and data-search-intent on the root article element.",
            `data-primary-keyword present: ${hasPrimary}. data-search-intent present: ${hasIntent}.`,
            `Set the root article element to include both attributes, for example: <article data-primary-keyword="${context.primaryKeyword ?? ""}" data-search-intent="${context.request.search_intent ?? ""}">.`
          );
        }
      ),
      makeCheck(
        "C5",
        "HTML includes an embedded JSON-LD script",
        "Look for <script type=\"application/ld+json\"> in the rendered HTML.",
        (context) => {
          if (!context.html) {
            return unverifiable("C5", "HTML includes an embedded JSON-LD script", "Look for <script type=\"application/ld+json\"> in the rendered HTML.", "HTML was not provided.");
          }
          if (/<script type="application\/ld\+json">/i.test(context.html)) {
            return pass("C5", "HTML includes an embedded JSON-LD script", "Look for <script type=\"application/ld+json\"> in the rendered HTML.", "Embedded JSON-LD script tag detected.");
          }
          return fail(
            "C5",
            "HTML includes an embedded JSON-LD script",
            "Look for <script type=\"application/ld+json\"> in the rendered HTML.",
            "No embedded JSON-LD script tag was detected in the HTML.",
            'Add `<script type="application/ld+json">{...}</script>` inside the article or head so crawlers receive the structured data with the page.'
          );
        }
      ),
    ],
  },
  {
    id: "D",
    title: "Structured Data & Entity Coverage",
    weight: 25,
    checks: [
      makeCheck(
        "D1",
        "JSON-LD includes a BlogPosting node",
        "Inspect the JSON-LD graph for @type BlogPosting.",
        (context) => {
          if (!context.jsonLd) {
            return unverifiable("D1", "JSON-LD includes a BlogPosting node", "Inspect the JSON-LD graph for @type BlogPosting.", "JSON-LD was not provided.");
          }
          const node = findGraphNodeByType(context.graphNodes, "BlogPosting");
          if (node) {
            return pass("D1", "JSON-LD includes a BlogPosting node", "Inspect the JSON-LD graph for @type BlogPosting.", "BlogPosting node detected.");
          }
          return fail(
            "D1",
            "JSON-LD includes a BlogPosting node",
            "Inspect the JSON-LD graph for @type BlogPosting.",
            "No BlogPosting node was found in the JSON-LD graph.",
            'Add a `BlogPosting` node with `headline`, `description`, `url`, `author`, `publisher`, `datePublished`, and `dateModified`.'
          );
        }
      ),
      makeCheck(
        "D2",
        "Core BlogPosting fields are complete",
        "Verify the BlogPosting node has headline, description, url, author, publisher, datePublished, and dateModified.",
        (context) => {
          if (!context.jsonLd) {
            return unverifiable("D2", "Core BlogPosting fields are complete", "Verify the BlogPosting node has headline, description, url, author, publisher, datePublished, and dateModified.", "JSON-LD was not provided.");
          }
          const node = findGraphNodeByType(context.graphNodes, "BlogPosting");
          if (!node) {
            return fail(
              "D2",
              "Core BlogPosting fields are complete",
              "Verify the BlogPosting node has headline, description, url, author, publisher, datePublished, and dateModified.",
              "BlogPosting node is missing, so the core fields cannot be complete.",
              'Create a `BlogPosting` node and populate `headline`, `description`, `url`, `author`, `publisher`, `datePublished`, and `dateModified`.'
            );
          }
          const requiredFields = [
            "headline",
            "description",
            "url",
            "author",
            "publisher",
            "datePublished",
            "dateModified",
          ];
          const missing = requiredFields.filter((field) => !(field in node) || node[field] == null || node[field] === "");
          if (missing.length === 0) {
            return pass("D2", "Core BlogPosting fields are complete", "Verify the BlogPosting node has headline, description, url, author, publisher, datePublished, and dateModified.", "All core BlogPosting fields are present.");
          }
          return fail(
            "D2",
            "Core BlogPosting fields are complete",
            "Verify the BlogPosting node has headline, description, url, author, publisher, datePublished, and dateModified.",
            `Missing BlogPosting fields: ${missing.join(", ")}.`,
            `Populate the BlogPosting node with these missing fields: ${missing.join(", ")}.`
          );
        }
      ),
      makeCheck(
        "D3",
        "FAQ schema is present when the article contains FAQs",
        "If article.faq has items, verify a FAQPage node exists in JSON-LD.",
        (context) => {
          const hasFaqContent = (context.article?.faq.length ?? 0) > 0 || /id="faq"/i.test(context.html ?? "");
          if (!hasFaqContent) {
            return na("D3", "FAQ schema is present when the article contains FAQs", "If article.faq has items, verify a FAQPage node exists in JSON-LD.", "No FAQ content detected, so FAQ schema is not required.");
          }
          if (!context.jsonLd) {
            return unverifiable("D3", "FAQ schema is present when the article contains FAQs", "If article.faq has items, verify a FAQPage node exists in JSON-LD.", "FAQ content exists but JSON-LD was not provided.");
          }
          if (findGraphNodeByType(context.graphNodes, "FAQPage")) {
            return pass("D3", "FAQ schema is present when the article contains FAQs", "If article.faq has items, verify a FAQPage node exists in JSON-LD.", "FAQPage node detected.");
          }
          return fail(
            "D3",
            "FAQ schema is present when the article contains FAQs",
            "If article.faq has items, verify a FAQPage node exists in JSON-LD.",
            "FAQ content exists but no FAQPage schema was found.",
            'Add a `FAQPage` node whose `mainEntity` array mirrors every FAQ question and accepted answer in the article.'
          );
        }
      ),
      makeCheck(
        "D4",
        "Evidence sources are modeled as cited entities in JSON-LD",
        "Check for citation or cited CreativeWork nodes tied to the BlogPosting.",
        (context) => {
          if (!context.jsonLd) {
            return unverifiable("D4", "Evidence sources are modeled as cited entities in JSON-LD", "Check for citation or cited CreativeWork nodes tied to the BlogPosting.", "JSON-LD was not provided.");
          }
          const blogPosting = findGraphNodeByType(context.graphNodes, "BlogPosting");
          const creativeWorks = context.graphNodes.filter((node) => getNodeTypes(node).includes("CreativeWork"));
          const citations = Array.isArray(blogPosting?.citation) ? blogPosting?.citation : [];
          if (creativeWorks.length > 0 && citations.length > 0) {
            return pass("D4", "Evidence sources are modeled as cited entities in JSON-LD", "Check for citation or cited CreativeWork nodes tied to the BlogPosting.", `Detected ${creativeWorks.length} CreativeWork source nodes and ${citations.length} citation links.`);
          }
          return fail(
            "D4",
            "Evidence sources are modeled as cited entities in JSON-LD",
            "Check for citation or cited CreativeWork nodes tied to the BlogPosting.",
            `Detected ${creativeWorks.length} CreativeWork nodes and ${citations.length} citation links.`,
            "Add one `CreativeWork` node per evidence source and reference those nodes from `BlogPosting.citation`."
          );
        }
      ),
      makeCheck(
        "D5",
        "JSON-LD names the main entities or topics explicitly",
        "Check BlogPosting for about or mentions arrays with meaningful entity strings or typed nodes.",
        (context) => {
          if (!context.jsonLd) {
            return unverifiable("D5", "JSON-LD names the main entities or topics explicitly", "Check BlogPosting for about or mentions arrays with meaningful entity strings or typed nodes.", "JSON-LD was not provided.");
          }
          const blogPosting = findGraphNodeByType(context.graphNodes, "BlogPosting");
          const about = Array.isArray(blogPosting?.about) ? blogPosting?.about : [];
          const mentions = Array.isArray(blogPosting?.mentions) ? blogPosting?.mentions : [];
          if (about.length > 0 || mentions.length > 0) {
            return pass("D5", "JSON-LD names the main entities or topics explicitly", "Check BlogPosting for about or mentions arrays with meaningful entity strings or typed nodes.", `Detected about=${about.length} and mentions=${mentions.length}.`);
          }
          return fail(
            "D5",
            "JSON-LD names the main entities or topics explicitly",
            "Check BlogPosting for about or mentions arrays with meaningful entity strings or typed nodes.",
            "No explicit topic/entity arrays were found on the BlogPosting node.",
            `Add \`about\` or \`mentions\` to the BlogPosting node, for example: "about": ["${context.request.topic ?? context.primaryKeyword ?? "topic"}"].`
          );
        }
      ),
      makeCheck(
        "D6",
        "Format-specific schema is present when the format requires it",
        "Require HowTo schema for how-to posts and BreadcrumbList when breadcrumbs are supplied.",
        (context) => {
          if (!context.jsonLd) {
            return unverifiable("D6", "Format-specific schema is present when the format requires it", "Require HowTo schema for how-to posts and BreadcrumbList when breadcrumbs are supplied.", "JSON-LD was not provided.");
          }
          const needsHowTo = context.format === "how_to";
          const hasHowTo = Boolean(findGraphNodeByType(context.graphNodes, "HowTo"));
          const hasBreadcrumbs = Boolean(findGraphNodeByType(context.graphNodes, "BreadcrumbList"));
          const needsBreadcrumbs = (context.article?.breadcrumbs.length ?? 0) > 0;

          if (!needsHowTo && !needsBreadcrumbs) {
            return na("D6", "Format-specific schema is present when the format requires it", "Require HowTo schema for how-to posts and BreadcrumbList when breadcrumbs are supplied.", "This post does not require extra format-specific schema.");
          }

          if ((!needsHowTo || hasHowTo) && (!needsBreadcrumbs || hasBreadcrumbs)) {
            return pass("D6", "Format-specific schema is present when the format requires it", "Require HowTo schema for how-to posts and BreadcrumbList when breadcrumbs are supplied.", `HowTo required=${needsHowTo} present=${hasHowTo}; BreadcrumbList required=${needsBreadcrumbs} present=${hasBreadcrumbs}.`);
          }

          const missing: string[] = [];
          if (needsHowTo && !hasHowTo) {
            missing.push("HowTo");
          }
          if (needsBreadcrumbs && !hasBreadcrumbs) {
            missing.push("BreadcrumbList");
          }

          return fail(
            "D6",
            "Format-specific schema is present when the format requires it",
            "Require HowTo schema for how-to posts and BreadcrumbList when breadcrumbs are supplied.",
            `Missing format-specific schema nodes: ${missing.join(", ")}.`,
            `Add these JSON-LD nodes: ${missing.join(", ")}. Map article steps into HowTo and article.breadcrumbs into BreadcrumbList itemListElement.`
          );
        }
      ),
    ],
  },
  {
    id: "E",
    title: "Evidence, Trust & Content Quality",
    weight: 15,
    checks: [
      makeCheck(
        "E1",
        "Factual paragraphs are source-backed",
        "Check citation_ids on intro, section paragraphs, FAQ answers, and conclusion paragraphs.",
        (context) => {
          if (!context.article) {
            return unverifiable("E1", "Factual paragraphs are source-backed", "Check citation_ids on intro, section paragraphs, FAQ answers, and conclusion paragraphs.", "Structured article paragraphs were not provided.");
          }
          const blocks = [
            ...context.article.intro,
            ...context.article.sections.flatMap((section) => section.paragraphs),
            ...context.article.conclusion,
          ];
          const uncitedBlocks = blocks.filter((block) => block.citation_ids.length === 0).length;
          if (uncitedBlocks === 0) {
            return pass("E1", "Factual paragraphs are source-backed", "Check citation_ids on intro, section paragraphs, FAQ answers, and conclusion paragraphs.", `All ${blocks.length} measured narrative blocks include citations.`);
          }
          return fail(
            "E1",
            "Factual paragraphs are source-backed",
            "Check citation_ids on intro, section paragraphs, FAQ answers, and conclusion paragraphs.",
            `${uncitedBlocks} of ${blocks.length} narrative blocks have no citation_ids.`,
            "Add at least one valid `citation_id` to every factual intro, body, FAQ, and conclusion paragraph."
          );
        }
      ),
      makeCheck(
        "E2",
        "Provided sources are actually used",
        "Compare references or request.source_count against cited source ids and validation.uncited_source_ids.",
        (context) => {
          const uncited = context.input.validation?.uncited_source_ids ?? [];
          if (context.references.length === 0 && typeof context.request.source_count !== "number") {
            return unverifiable("E2", "Provided sources are actually used", "Compare references or request.source_count against cited source ids and validation.uncited_source_ids.", "No source inventory was provided.");
          }
          if (uncited.length === 0) {
            return pass("E2", "Provided sources are actually used", "Compare references or request.source_count against cited source ids and validation.uncited_source_ids.", "All provided sources are cited at least once.");
          }
          return fail(
            "E2",
            "Provided sources are actually used",
            "Compare references or request.source_count against cited source ids and validation.uncited_source_ids.",
            `These sources are currently unused: ${uncited.join(", ")}.`,
            `Either cite these source ids in relevant factual blocks or remove them from the source set: ${uncited.join(", ")}.`
          );
        }
      ),
      makeCheck(
        "E3",
        "The article contains concrete specifics, not just generic claims",
        "Look for numbers, dates, prices, percentages, or named frameworks in article text or HTML.",
        (context) => {
          const text = context.article
            ? [
                context.article.title,
                context.article.meta_description,
                ...context.article.intro.map((item) => item.text),
                ...context.article.sections.flatMap((section) => [
                  section.heading,
                  ...section.paragraphs.map((paragraph) => paragraph.text),
                  ...section.bullets,
                ]),
                ...context.article.faq.flatMap((item) => [item.question, item.answer]),
                ...context.article.conclusion.map((item) => item.text),
              ].join(" ")
            : stripHtml(context.html ?? "");
          if (!text) {
            return unverifiable("E3", "The article contains concrete specifics, not just generic claims", "Look for numbers, dates, prices, percentages, or named frameworks in article text or HTML.", "No content text was available.");
          }
          const hasSpecifics = /\b\d+\b|\$\d+|£\d+|€\d+|\b20\d{2}\b|%\b|framework|checklist|step-by-step|example/i.test(
            text
          );
          if (hasSpecifics) {
            return pass("E3", "The article contains concrete specifics, not just generic claims", "Look for numbers, dates, prices, percentages, or named frameworks in article text or HTML.", "Detected at least one concrete statistic, date, price, or framework cue.");
          }
          return fail(
            "E3",
            "The article contains concrete specifics, not just generic claims",
            "Look for numbers, dates, prices, percentages, or named frameworks in article text or HTML.",
            "No concrete specifics were detected in the supplied content.",
            'Replace vague claims with sourced specifics, for example change "this helps a lot" to a sentence containing a date, number, price, percentage, or named framework.'
          );
        }
      ),
      makeCheck(
        "E4",
        "Brand mentions feel integrated rather than stuffed",
        "Count brand-name mentions in article text and compare them to total word count.",
        (context) => {
          if (!context.brandName) {
            return unverifiable("E4", "Brand mentions feel integrated rather than stuffed", "Count brand-name mentions in article text and compare them to total word count.", "Brand name was not provided in the request.");
          }
          const text = context.article
            ? [
                context.article.title,
                context.article.excerpt,
                ...context.article.intro.map((item) => item.text),
                ...context.article.sections.flatMap((section) => section.paragraphs.map((paragraph) => paragraph.text)),
                ...context.article.conclusion.map((item) => item.text),
                context.article.call_to_action?.text ?? "",
              ].join(" ")
            : stripHtml(context.html ?? "");
          if (!text) {
            return unverifiable("E4", "Brand mentions feel integrated rather than stuffed", "Count brand-name mentions in article text and compare them to total word count.", "No content text was available.");
          }
          const matches = text.match(new RegExp(context.brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")) ?? [];
          const words = countWords(text);
          const density = words === 0 ? 0 : (matches.length / words) * 100;
          if (density <= 1.5) {
            return pass("E4", "Brand mentions feel integrated rather than stuffed", "Count brand-name mentions in article text and compare them to total word count.", `Brand density is ${density.toFixed(2)}% (${matches.length} mentions across ${words} words).`);
          }
          return fail(
            "E4",
            "Brand mentions feel integrated rather than stuffed",
            "Count brand-name mentions in article text and compare them to total word count.",
            `Brand density is ${density.toFixed(2)}% (${matches.length} mentions across ${words} words).`,
            `Reduce repeated mentions of "${context.brandName}" and replace some instances with neutral nouns like "the platform", "the workflow", or "the product".`
          );
        }
      ),
      makeCheck(
        "E5",
        "The article closes with a synthesized conclusion",
        "Check for at least one conclusion paragraph that summarizes the payoff, not just a CTA.",
        (context) => {
          const conclusion = context.article?.conclusion ?? [];
          if (!context.article && !context.html) {
            return unverifiable("E5", "The article closes with a synthesized conclusion", "Check for at least one conclusion paragraph that summarizes the payoff, not just a CTA.", "No article or HTML was provided.");
          }
          if (conclusion.length > 0 && conclusion.some((paragraph) => countWords(paragraph.text) >= 12)) {
            return pass("E5", "The article closes with a synthesized conclusion", "Check for at least one conclusion paragraph that summarizes the payoff, not just a CTA.", `Detected ${conclusion.length} conclusion paragraph(s).`);
          }
          if (/<section id="conclusion">/i.test(context.html ?? "")) {
            return pass("E5", "The article closes with a synthesized conclusion", "Check for at least one conclusion paragraph that summarizes the payoff, not just a CTA.", "Conclusion section detected in HTML.");
          }
          return fail(
            "E5",
            "The article closes with a synthesized conclusion",
            "Check for at least one conclusion paragraph that summarizes the payoff, not just a CTA.",
            "No substantive conclusion block was detected.",
            "Add a conclusion paragraph that restates the main takeaway and decision criteria before the CTA."
          );
        }
      ),
    ],
  },
  // ─── Section F: Human Signals (Google Helpful Content System compliance) ──
  // The 7 signals that distinguish editorial content from raw AI output.
  // Failing these triggers Helpful Content demotion regardless of SEO score.
  {
    id: "F",
    title: "Human Signals & E-E-A-T (Helpful Content System)",
    weight: 25,
    checks: [
      makeCheck(
        "F1",
        "Author is a Person entity with sameAs LinkedIn URL",
        "Check JSON-LD BlogPosting.author for Person with sameAs containing linkedin.com.",
        (context) => {
          const text = context.input.json_ld_string ?? JSON.stringify(context.jsonLd ?? {});
          if (!text || text === "{}") {
            return unverifiable(
              "F1",
              "Author is a Person entity with sameAs LinkedIn URL",
              "Check JSON-LD BlogPosting.author for Person with sameAs containing linkedin.com.",
              "No JSON-LD supplied."
            );
          }
          const hasPerson = /"@type"\s*:\s*"Person"/i.test(text);
          const hasLinkedIn = /sameAs[^}]*linkedin\.com/i.test(text);
          if (hasPerson && hasLinkedIn) {
            return pass(
              "F1",
              "Author is a Person entity with sameAs LinkedIn URL",
              "Check JSON-LD BlogPosting.author for Person with sameAs containing linkedin.com.",
              "Person author with LinkedIn sameAs detected."
            );
          }
          return fail(
            "F1",
            "Author is a Person entity with sameAs LinkedIn URL",
            "Check JSON-LD BlogPosting.author for Person with sameAs containing linkedin.com.",
            hasPerson
              ? "Author Person entity exists but sameAs LinkedIn URL is missing."
              : "No Person entity with sameAs detected for the author.",
            "Provide author: { name, title, bio, linkedin_url } in the request. Writer will emit Person schema with sameAs linking to LinkedIn."
          );
        }
      ),
      makeCheck(
        "F2",
        "Article contains first-party data signals",
        "Look for 'we found', 'our data', 'in our audit', 'we tested' + specific numbers.",
        (context) => {
          const text = context.article
            ? [
                ...context.article.intro.map((i) => i.text),
                ...context.article.sections.flatMap((s) => [
                  s.heading,
                  ...s.paragraphs.map((p) => p.text),
                  ...s.bullets,
                ]),
                ...context.article.conclusion.map((c) => c.text),
              ].join(" ")
            : stripHtml(context.html ?? "");
          if (!text) {
            return unverifiable(
              "F2",
              "Article contains first-party data signals",
              "Look for 'we found', 'our data', 'in our audit', 'we tested' + specific numbers.",
              "No article body text available."
            );
          }
          // First-party data markers
          const fpdPattern =
            /\b(we (?:found|tested|ran|analyzed|analysed|measured|tracked|audited|observed)|our (?:data|audit|research|study|platform|team|analysis)|in our (?:audit|research|dataset|analysis)|based on (?:\d+[\d,]*|our) (?:prompts|audits|tests|customers|users|brands)|when we)\b/i;
          const numberNearby =
            /(\b\d+[\d,]*(?:\.\d+)?%|\b\d{1,3}(?:,\d{3})+\b|\b\$\d+|\b\d{2,}\s*(?:brands?|companies|customers?|users?|prompts?|tests?))/i;
          const hasMarker = fpdPattern.test(text);
          const hasNumber = numberNearby.test(text);
          if (hasMarker && hasNumber) {
            return pass(
              "F2",
              "Article contains first-party data signals",
              "Look for 'we found', 'our data', 'in our audit', 'we tested' + specific numbers.",
              "Both first-party markers and specific numeric data detected."
            );
          }
          return fail(
            "F2",
            "Article contains first-party data signals",
            "Look for 'we found', 'our data', 'in our audit', 'we tested' + specific numbers.",
            hasMarker
              ? "First-party markers found but no specific numbers near them."
              : "No first-party data markers detected (e.g., 'we found X%', 'our audit of N').",
            "Inject at least one first-party data point with a specific metric: 'In our audit of N X, we found Y%.'"
          );
        }
      ),
      makeCheck(
        "F3",
        "Article cites named brands/products with specifics (not generic)",
        "Look for proper-noun brand names + specific metrics; flag 'leading companies', 'top brands', 'many companies'.",
        (context) => {
          const text = context.article
            ? [
                ...context.article.sections.flatMap((s) =>
                  s.paragraphs.map((p) => p.text).concat(s.bullets)
                ),
              ].join(" ")
            : stripHtml(context.html ?? "");
          if (!text) {
            return unverifiable(
              "F3",
              "Article cites named brands/products with specifics (not generic)",
              "Look for proper-noun brand names + specific metrics; flag 'leading companies', 'top brands', 'many companies'.",
              "No body text available."
            );
          }
          const genericTells =
            /\b(leading (?:companies|brands)|top (?:companies|brands)|many (?:companies|brands)|various (?:companies|brands)|several (?:companies|brands)|some (?:companies|brands)|industry (?:leaders|giants))\b/gi;
          const genericMatches = text.match(genericTells) ?? [];
          // Heuristic: proper-noun candidates (TitleCase words that aren't at sentence start)
          const properNouns = text.match(
            /(?<!\.\s|^|\n|!\s|\?\s)\b([A-Z][a-z]{2,}(?:\s[A-Z][a-z]+)*|[A-Z]{2,})\b/g
          );
          const uniqueNouns = new Set(properNouns ?? []);
          if (uniqueNouns.size >= 3 && genericMatches.length === 0) {
            return pass(
              "F3",
              "Article cites named brands/products with specifics (not generic)",
              "Look for proper-noun brand names + specific metrics; flag 'leading companies', 'top brands', 'many companies'.",
              `${uniqueNouns.size} distinct named entities detected; no generic company language.`
            );
          }
          if (genericMatches.length > 0) {
            return fail(
              "F3",
              "Article cites named brands/products with specifics (not generic)",
              "Look for proper-noun brand names + specific metrics; flag 'leading companies', 'top brands', 'many companies'.",
              `Generic company language used ${genericMatches.length} time(s): ${Array.from(new Set(genericMatches)).slice(0, 3).join(", ")}.`,
              "Replace generic references ('leading companies', 'top brands') with specific named examples and their metrics."
            );
          }
          return fail(
            "F3",
            "Article cites named brands/products with specifics (not generic)",
            "Look for proper-noun brand names + specific metrics; flag 'leading companies', 'top brands', 'many companies'.",
            "Fewer than 3 distinct named entity candidates detected.",
            "Include at least 3 real, named brands or products with specific numbers in the article body."
          );
        }
      ),
      makeCheck(
        "F4",
        "Article takes a clear editorial stance",
        "Look for an opinionated claim, 'our view', 'we argue', 'the better pattern', or a visible Our-Take block.",
        (context) => {
          const html = context.html ?? "";
          const text = context.article
            ? [
                ...context.article.intro.map((i) => i.text),
                ...context.article.conclusion.map((c) => c.text),
              ].join(" ")
            : stripHtml(html);
          const hasStanceBanner =
            /editorial-stance|class="editorial-stance"|stance-claim|Our take/i.test(html);
          const stancePattern =
            /\b(we (?:argue|believe|recommend|cut|disagree|think|advise)|our (?:take|view|position|stance|opinion|recommendation)|the (?:better|right|safe) pattern|don'?t (?:do|use|rely on)|stop (?:doing|using)|the mistake|contrarian|unlike|we think|here'?s what works)\b/i;
          const hedgePattern =
            /\b(there are (?:pros and cons|many factors|various options)|it depends|it'?s important to note|in today'?s fast-paced world)\b/i;
          const hasStance = stancePattern.test(text);
          const hasHedge = hedgePattern.test(text);
          if (hasStanceBanner || (hasStance && !hasHedge)) {
            return pass(
              "F4",
              "Article takes a clear editorial stance",
              "Look for an opinionated claim, 'our view', 'we argue', 'the better pattern', or a visible Our-Take block.",
              hasStanceBanner
                ? "Editorial stance banner is present."
                : "Stance language detected without hedging."
            );
          }
          return fail(
            "F4",
            "Article takes a clear editorial stance",
            "Look for an opinionated claim, 'our view', 'we argue', 'the better pattern', or a visible Our-Take block.",
            hasHedge
              ? "Hedging language detected without a clear counter-stance."
              : "No 'our take'/'we recommend'/'the better pattern' phrasing found.",
            "Add an editorial_stance claim to the request. Writer will render an 'Our take' banner and state the POV in intro + conclusion."
          );
        }
      ),
      makeCheck(
        "F5",
        "Article includes an original visual (screenshot, diagram, chart)",
        "Look for original-visual markers in HTML (not the hero image or stock photos).",
        (context) => {
          const html = context.html ?? "";
          if (!html) {
            return unverifiable(
              "F5",
              "Article includes an original visual (screenshot, diagram, chart)",
              "Look for original-visual markers in HTML (not the hero image or stock photos).",
              "No HTML supplied."
            );
          }
          const placeholderCount = (html.match(/data-visual-id=/g) ?? []).length;
          const needsReplacement =
            (html.match(/data-needs-replacement="true"/g) ?? []).length;
          // If there are original visual markers AND none need replacement, pass.
          if (placeholderCount > 0 && needsReplacement === 0) {
            return pass(
              "F5",
              "Article includes an original visual (screenshot, diagram, chart)",
              "Look for original-visual markers in HTML (not the hero image or stock photos).",
              `${placeholderCount} original visual(s) embedded.`
            );
          }
          if (needsReplacement > 0) {
            return fail(
              "F5",
              "Article includes an original visual (screenshot, diagram, chart)",
              "Look for original-visual markers in HTML (not the hero image or stock photos).",
              `${needsReplacement} visual placeholder(s) still need replacement.`,
              "Upload the original screenshot/diagram/chart and update the writer request with asset_url for each original_visual."
            );
          }
          return fail(
            "F5",
            "Article includes an original visual (screenshot, diagram, chart)",
            "Look for original-visual markers in HTML (not the hero image or stock photos).",
            "No original visual markers present (hero image alone does not count).",
            "Add at least one original_visual in the request describing a screenshot, diagram, chart, or framework specific to this brand."
          );
        }
      ),
      makeCheck(
        "F6",
        "3+ primary-tier citations are present",
        "Count references with authority_tier='primary' and verify they're cited in the body.",
        (context) => {
          const refs = context.references ?? [];
          if (refs.length === 0) {
            return unverifiable(
              "F6",
              "3+ primary-tier citations are present",
              "Count references with authority_tier='primary' and verify they're cited in the body.",
              "No references provided to audit."
            );
          }
          const primary = refs.filter(
            (r) => (r as { authority_tier?: string }).authority_tier === "primary"
          );
          if (primary.length >= 3) {
            return pass(
              "F6",
              "3+ primary-tier citations are present",
              "Count references with authority_tier='primary' and verify they're cited in the body.",
              `${primary.length} primary-tier sources provided.`
            );
          }
          return fail(
            "F6",
            "3+ primary-tier citations are present",
            "Count references with authority_tier='primary' and verify they're cited in the body.",
            `Only ${primary.length} primary-tier source(s) (need 3+). Editorial-tier sources dominate.`,
            "Swap marketing blog citations for primary sources: arXiv, OpenAI docs, Google Search Central, W3C, gov/edu, peer-reviewed research."
          );
        }
      ),
      makeCheck(
        "F7",
        "Article has visible Last Reviewed + Next Review dates",
        "Look for 'Last reviewed' / 'Next review' timestamps in the rendered HTML byline area.",
        (context) => {
          const html = context.html ?? "";
          if (!html) {
            return unverifiable(
              "F7",
              "Article has visible Last Reviewed + Next Review dates",
              "Look for 'Last reviewed' / 'Next review' timestamps in the rendered HTML byline area.",
              "No HTML supplied."
            );
          }
          const lastReviewed = /Last reviewed/i.test(html);
          const nextReview = /Next review/i.test(html);
          const dateModifiedSchema = /"dateModified"/i.test(
            context.input.json_ld_string ?? JSON.stringify(context.jsonLd ?? {})
          );
          if (lastReviewed && nextReview && dateModifiedSchema) {
            return pass(
              "F7",
              "Article has visible Last Reviewed + Next Review dates",
              "Look for 'Last reviewed' / 'Next review' timestamps in the rendered HTML byline area.",
              "Visible Last Reviewed + Next Review + dateModified schema present."
            );
          }
          return fail(
            "F7",
            "Article has visible Last Reviewed + Next Review dates",
            "Look for 'Last reviewed' / 'Next review' timestamps in the rendered HTML byline area.",
            `Missing: ${[!lastReviewed && "Last reviewed", !nextReview && "Next review", !dateModifiedSchema && "dateModified schema"].filter(Boolean).join(", ")}.`,
            "Use the rich author byline (writer does this automatically when `author` is provided) and set `article.next_review_date` in the request."
          );
        }
      ),
      makeCheck(
        "F8",
        "No banned AI-tell phrases in the body",
        "Scan for filler/hedge phrases that signal unreviewed AI output.",
        (context) => {
          const text = context.article
            ? [
                context.article.meta_description,
                ...context.article.intro.map((i) => i.text),
                ...context.article.sections.flatMap((s) =>
                  s.paragraphs.map((p) => p.text).concat(s.bullets)
                ),
                ...context.article.faq.flatMap((f) => [f.question, f.answer]),
                ...context.article.conclusion.map((c) => c.text),
              ].join(" ")
            : stripHtml(context.html ?? "");
          if (!text) {
            return unverifiable(
              "F8",
              "No banned AI-tell phrases in the body",
              "Scan for filler/hedge phrases that signal unreviewed AI output.",
              "No body text available."
            );
          }
          const banned = [
            "in today's fast-paced world",
            "it's important to note",
            "game-changing",
            "seamless",
            "best-in-class",
            "cutting-edge",
            "revolutionary",
            "in the ever-evolving landscape",
            "studies show",
            "many brands",
            "in conclusion",
            "at the end of the day",
            "when it comes to",
          ];
          const lower = text.toLowerCase();
          const hits = banned.filter((phrase) => lower.includes(phrase));
          if (hits.length === 0) {
            return pass(
              "F8",
              "No banned AI-tell phrases in the body",
              "Scan for filler/hedge phrases that signal unreviewed AI output.",
              "No banned AI-tell phrases detected."
            );
          }
          return fail(
            "F8",
            "No banned AI-tell phrases in the body",
            "Scan for filler/hedge phrases that signal unreviewed AI output.",
            `Banned phrases detected: ${hits.join(", ")}.`,
            "Rewrite sentences using these phrases with specific, concrete language. These are strong AI-tells and Helpful Content demotion signals."
          );
        }
      ),
    ],
  },
] as const;

function scoreSection(
  definition: (typeof sectionDefinitions)[number],
  context: AuditContext
): AuditSectionResult {
  const checks = definition.checks.map((check) => check(context));
  const pass_count = checks.filter((check) => check.status === "pass").length;
  const fail_count = checks.filter((check) => check.status === "fail").length;
  const na_count = checks.filter((check) => check.status === "na").length;
  const unverifiable_count = checks.filter((check) => check.status === "unverifiable").length;
  const applicable_checks = pass_count + fail_count;
  const score = applicable_checks > 0 ? Math.round((pass_count / applicable_checks) * 100) : null;

  return {
    id: definition.id,
    title: definition.title,
    weight: definition.weight,
    score,
    applicable_checks,
    pass_count,
    fail_count,
    na_count,
    unverifiable_count,
    checks,
  };
}

function toRating(score: number | null): BlogAuditOutput["summary"]["rating"] {
  if (score == null) {
    return "Insufficient input";
  }
  if (score >= 90) {
    return "Publish-ready";
  }
  if (score >= 75) {
    return "Minor fixes needed";
  }
  if (score >= 60) {
    return "Significant gaps";
  }
  return "Major rework required";
}

export function auditBlogPackage(rawInput: unknown): BlogAuditOutput {
  const context = createContext(rawInput);
  const sections = sectionDefinitions.map((definition) => scoreSection(definition, context));
  const weightedSections = sections.filter((section) => section.score != null);
  const totalWeight = weightedSections.reduce((sum, section) => sum + section.weight, 0);
  const overall_score =
    totalWeight > 0
      ? Math.round(
          weightedSections.reduce((sum, section) => sum + (section.score ?? 0) * section.weight, 0) /
            totalWeight
        )
      : null;

  const fix_summary = sections.flatMap((section) =>
    section.checks
      .filter((check) => check.status === "fail" && check.exact_fix)
      .map((check) => ({
        check_id: check.id,
        section_id: section.id,
        issue: check.label,
        exact_fix: check.exact_fix as string,
      }))
  );

  const previousScore = context.input.iteration?.previous_score ?? null;
  const previousFailedChecks = new Set(context.input.iteration?.previous_failed_checks ?? []);
  const passingCheckIds = new Set(
    sections.flatMap((section) => section.checks.filter((check) => check.status === "pass").map((check) => check.id))
  );
  const previously_failed_now_passing = Array.from(previousFailedChecks).filter((id) =>
    passingCheckIds.has(id)
  );

  return {
    detected_format: {
      value: context.format,
      confidence: context.formatConfidence,
      signals: context.formatSignals,
    },
    input_coverage: {
      article: Boolean(context.article),
      html: Boolean(context.html),
      json_ld: Boolean(context.jsonLd),
      references: context.references.length > 0,
    },
    summary: {
      overall_score,
      rating: toRating(overall_score),
      score_delta_vs_previous:
        overall_score != null && previousScore != null ? Math.round((overall_score - previousScore) * 10) / 10 : null,
      previously_failed_now_passing,
      fixes_applied: context.input.iteration?.fixes_applied ?? [],
    },
    sections,
    fix_summary,
  };
}

export type BlogAuditInput = z.infer<typeof BlogAuditInputSchema>;
export type { BlogAuditOutput };

import type {
  BlogDraft,
  BlogSource,
  BlogWriterRequest,
  BlogWriterResponse,
} from "./types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Canonical markdown representation of a generated blog post.
//
// The markdown is the portable source of truth. HTML + JSON-LD are renders of
// this document. If a site migrates to a new CMS or static generator, the .md
// survives and every downstream system (Jamstack, Contentful, Sanity, Ghost,
// Hugo, etc.) can consume it with minimal adaptation.
//
// Structure:
//   - YAML front-matter (title, slug, author, dates, keywords, meta, etc.)
//   - # H1 (title)
//   - > Editorial-stance blockquote (when provided)
//   - ## Quick answer (bullets)
//   - ## Introduction
//   - ## Key takeaways (bullets)
//   - ## <section headings> with paragraphs, bullets, citations as [^id]
//   - ## Summary
//   - ## Frequently asked questions
//   - ## Conclusion
//   - ## <CTA heading> (when provided)
//   - ## About the author (when provided)
//   - ## Editorial integrity checklist (when signals enforced)
//   - ## References (footnotes)
//
// Citations are emitted as inline [^source-id] references and resolved at the
// bottom with [^source-id]: Title — URL (Publisher).
// ─────────────────────────────────────────────────────────────────────────────

function yamlEscape(value: string): string {
  // Quote strings that contain YAML-special chars or start with reserved forms.
  if (value.includes(":") || value.includes("#") || value.includes('"') || value.startsWith("- ") || value.startsWith("* ")) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
}

function yamlList(items: string[] | undefined, indent = 2): string {
  if (!items || items.length === 0) return "[]";
  const pad = " ".repeat(indent);
  return `\n${items.map((v) => `${pad}- ${yamlEscape(v)}`).join("\n")}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

// Normalize citation_ids into a footnote-style suffix — e.g. [^openai-docs][^gartner-ai-search]
function renderCitations(citation_ids: string[]): string {
  if (!citation_ids || citation_ids.length === 0) return "";
  return citation_ids.map((id) => `[^${id}]`).join("");
}

function renderParagraph(text: string, citation_ids: string[] = []): string {
  return `${text}${renderCitations(citation_ids)}`;
}

function renderBullets(items: string[] | undefined): string {
  if (!items || items.length === 0) return "";
  return items.map((b) => `- ${b}`).join("\n");
}

function renderReferences(sources: BlogSource[]): string {
  if (!sources || sources.length === 0) return "";
  return sources
    .map((s) => {
      const parts = [s.title, s.url];
      if (s.publisher) parts.push(`(${s.publisher})`);
      return `[^${s.id}]: ${parts.join(" — ")}`;
    })
    .join("\n");
}

/**
 * Generate the canonical markdown file for a blog.
 * Consumes the same inputs as renderBlogHtml, so the markdown stays perfectly
 * aligned with the HTML render and the JSON-LD graph.
 */
export function renderBlogMarkdown(
  request: BlogWriterRequest,
  draft: BlogDraft,
  options: {
    publishedIso?: string;
    modifiedIso?: string;
    canonical_url?: string;
    editorial_checklist?: BlogWriterResponse["editorial_checklist"];
  } = {}
): string {
  const publishedIso = options.publishedIso ?? request.article.published_at ?? todayIso();
  const modifiedIso = options.modifiedIso ?? request.article.modified_at ?? publishedIso;
  const nextReviewIso = request.article.next_review_date ?? addDaysIso(90);

  const brand = request.brand.name;
  const author = request.author;
  const reviewer = request.reviewer;
  const stance = request.editorial_stance;

  const frontMatter = [
    "---",
    `title: ${yamlEscape(draft.title)}`,
    `slug: ${draft.slug}`,
    `brand: ${yamlEscape(brand)}`,
    `category: ${yamlEscape(request.article.category)}`,
    `primary_keyword: ${yamlEscape(request.primary_keyword)}`,
    `secondary_keywords:${yamlList(request.secondary_keywords)}`,
    `search_intent: ${request.search_intent}`,
    `post_format: ${draft.format}`,
    `meta_title: ${yamlEscape(draft.meta_title)}`,
    `meta_description: ${yamlEscape(draft.meta_description)}`,
    `excerpt: ${yamlEscape(draft.excerpt)}`,
    options.canonical_url ? `canonical_url: ${options.canonical_url}` : null,
    `published_at: ${publishedIso}`,
    `modified_at: ${modifiedIso}`,
    `next_review_date: ${nextReviewIso}`,
    author
      ? [
          "author:",
          `  name: ${yamlEscape(author.name)}`,
          `  title: ${yamlEscape(author.title)}`,
          `  linkedin_url: ${author.linkedin_url}`,
          author.twitter_url ? `  twitter_url: ${author.twitter_url}` : null,
          author.avatar_url ? `  avatar_url: ${author.avatar_url}` : null,
          author.expertise_keywords && author.expertise_keywords.length
            ? `  expertise_keywords:${yamlList(author.expertise_keywords, 4)}`
            : null,
        ]
          .filter(Boolean)
          .join("\n")
      : `author_name: ${yamlEscape(request.article.author_name)}`,
    reviewer
      ? [
          "reviewer:",
          `  name: ${yamlEscape(reviewer.name)}`,
          `  title: ${yamlEscape(reviewer.title)}`,
          `  linkedin_url: ${reviewer.linkedin_url}`,
        ].join("\n")
      : null,
    "---",
  ]
    .filter(Boolean)
    .join("\n");

  const breadcrumbs = draft.breadcrumbs
    .map((b) => `[${b.label}](${b.url})`)
    .join(" › ");

  const stanceBlock = stance
    ? `\n> **Our take** — ${stance.claim}\n>\n> ${stance.supporting_reasoning}\n`
    : "";

  const quickAnswer = draft.quick_answer.length
    ? `## Quick answer\n\n${renderBullets(draft.quick_answer)}\n`
    : "";

  const intro = draft.intro
    .map((p) => renderParagraph(p.text, p.citation_ids))
    .join("\n\n");

  const keyTakeaways = draft.key_takeaways.length
    ? `## Key takeaways\n\n${renderBullets(draft.key_takeaways)}\n`
    : "";

  const sections = draft.sections
    .map((sec) => {
      const paras = sec.paragraphs
        .map((p) => renderParagraph(p.text, p.citation_ids))
        .join("\n\n");
      const bullets = sec.bullets.length ? `\n\n${renderBullets(sec.bullets)}` : "";
      return `## ${sec.heading}\n\n${paras}${bullets}`;
    })
    .join("\n\n");

  const summary = draft.summary_box.length
    ? `## Summary\n\n${renderBullets(draft.summary_box)}\n`
    : "";

  const faq = draft.faq.length
    ? `## Frequently asked questions\n\n${draft.faq
        .map(
          (f) =>
            `### ${f.question}\n\n${renderParagraph(f.answer, f.citation_ids)}`
        )
        .join("\n\n")}\n`
    : "";

  const conclusion = draft.conclusion
    .map((p) => renderParagraph(p.text, p.citation_ids))
    .join("\n\n");

  const cta = draft.call_to_action
    ? `## Next step\n\n${draft.call_to_action.text}\n\n**[${draft.call_to_action.label}](${draft.call_to_action.url})**\n`
    : "";

  const authorBio = author
    ? `## About the author\n\n**${author.name}**, ${author.title}\n\n${author.bio}\n\n- [LinkedIn](${author.linkedin_url})${author.twitter_url ? `\n- [Twitter/X](${author.twitter_url})` : ""}${author.expertise_keywords && author.expertise_keywords.length ? `\n- Writes about: ${author.expertise_keywords.join(", ")}` : ""}\n`
    : "";

  const checklist = options.editorial_checklist && options.editorial_checklist.length
    ? `## Editorial integrity checklist\n\n${options.editorial_checklist
        .map((c) => `- ${c.pass ? "✅" : "❌"} **${c.label}** — ${c.detail}`)
        .join("\n")}\n`
    : "";

  const references = request.sources.length
    ? `## References\n\n${renderReferences(request.sources)}\n`
    : "";

  const body = [
    `# ${draft.title}`,
    breadcrumbs ? `*${breadcrumbs}*` : "",
    stanceBlock,
    quickAnswer,
    intro ? `## Introduction\n\n${intro}\n` : "",
    keyTakeaways,
    sections,
    summary,
    faq,
    conclusion ? `## Conclusion\n\n${conclusion}\n` : "",
    cta,
    authorBio,
    checklist,
    references,
  ]
    .filter((block) => block && block.trim().length > 0)
    .join("\n\n");

  return `${frontMatter}\n\n${body}\n`;
}

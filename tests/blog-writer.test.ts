import { describe, expect, it } from "vitest";
import {
  buildBlogJsonLd,
  normalizeDraftAgainstSources,
  renderBlogHtml,
} from "../src/blog/writer.js";
import type { BlogDraft, BlogWriterRequest } from "../src/blog/types.js";

const request: BlogWriterRequest = {
  topic: "What is answer engine optimization?",
  primary_keyword: "answer engine optimization",
  secondary_keywords: ["AEO", "AI search visibility"],
  search_intent: "informational",
  audience: "SaaS marketing leaders",
  angle: "Explain AEO clearly for teams building AI-visible content systems.",
  brand: {
    name: "TRYPS",
    domain: "jointryps.com",
    product_name: "TRYPS",
    product_description: "An AI workflow system for SEO, AEO, and citation-ready content operations.",
    audience: "Growth teams",
    tone_of_voice: "clear, strategic, evidence-led",
    differentiators: ["citation-ready publishing", "schema-rich output"],
    founder: "Jake Stein",
    twitter_handle: "@trypsapp",
  },
  sources: [
    {
      id: "google-ai-overviews",
      title: "Google Search's guidance on creating helpful, reliable, people-first content",
      url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
      publisher: "Google Search Central",
      excerpt: "Google recommends creating helpful, reliable, people-first content for Search success.",
    },
    {
      id: "schema-org",
      title: "Schema.org BlogPosting",
      url: "https://schema.org/BlogPosting",
      publisher: "Schema.org",
      excerpt: "BlogPosting is a subtype of Article for blog posts published online.",
    },
  ],
  article: {
    slug: "what-is-answer-engine-optimization",
    target_word_count: 1800,
    include_faq: true,
    include_howto_schema: false,
    include_comparison_table: false,
    cta_label: "See TRYPS",
    cta_url: "https://jointryps.com/start",
    author_name: "TRYPS Editorial Team",
    published_at: "2026-04-12T00:00:00.000Z",
    modified_at: "2026-04-12T00:00:00.000Z",
    hero_image_url: "https://jointryps.com/images/blog/what-is-answer-engine-optimization-hero.png",
    hero_image_alt: "Team planning a trip together on a shared travel board",
    category: "Travel Planning",
  },
  model: "gpt-4.1",
};

const draft: BlogDraft = {
  title: "What Is Answer Engine Optimization? A Practical Guide for Teams",
  slug: "what-is-answer-engine-optimization",
  meta_title: "What Is Answer Engine Optimization? Practical AEO Guide",
  meta_description: "Learn what answer engine optimization means, how it differs from SEO, and how to publish more citable content.",
  excerpt: "Answer engine optimization helps your content get extracted, cited, and reused by AI-driven search experiences.",
  format: "article",
  breadcrumbs: [
    { label: "Blog", url: "/blog" },
    { label: "Travel Planning", url: "/blog/travel-planning" },
    {
      label: "What Is Answer Engine Optimization?",
      url: "/blog/what-is-answer-engine-optimization",
    },
  ],
  quick_answer: [
    "Answer engine optimization makes content easier for AI systems to extract and cite.",
    "It builds on SEO by improving structure, clarity, and citation readiness.",
    "Strong AEO pages use clear answers, source-backed claims, and machine-readable markup.",
  ],
  intro: [
    {
      text: "Answer engine optimization is the practice of making content easier for search and AI systems to understand, extract, and cite.",
      citation_ids: ["google-ai-overviews"],
    },
  ],
  key_takeaways: [
    "AEO complements SEO rather than replacing it.",
    "Structured markup helps machines interpret page meaning.",
    "Source-backed claims improve citation potential.",
  ],
  sections: [
    {
      heading: "Why AEO matters now",
      purpose: "Explain why AI-driven search changes content requirements.",
      paragraphs: [
        {
          text: "AI-mediated results often compress content into direct answers, which increases the value of pages that are explicit, well-structured, and source-backed.",
          citation_ids: ["google-ai-overviews", "missing-source"],
        },
      ],
      bullets: ["Structure answers clearly", "Support factual claims with sources"],
    },
    {
      heading: "How schema supports extraction",
      purpose: "Show why machine-readable metadata matters.",
      paragraphs: [
        {
          text: "Schema.org defines BlogPosting as structured metadata for online blog articles, which helps systems understand page type and content attributes.",
          citation_ids: ["schema-org"],
        },
      ],
      bullets: [],
    },
    {
      heading: "How TRYPS Agent fits the workflow",
      purpose: "Connect the topic back to the product naturally.",
      paragraphs: [
        {
          text: "TRYPS Agent can operationalize briefs, citations, and schema output in one publishing workflow.",
          citation_ids: ["google-ai-overviews"],
        },
      ],
      bullets: [],
    },
  ],
  summary_box: [
    "AEO improves extractability, not just rankings.",
    "Structured markup supports machine understanding.",
    "Citations make factual content easier to trust and reuse.",
  ],
  faq: [
    {
      question: "Is AEO different from SEO?",
      answer: "Yes. SEO focuses on discoverability and ranking, while AEO adds clarity, extractability, and citation readiness for answer engines.",
      citation_ids: ["google-ai-overviews"],
    },
    {
      question: "Why does structure matter for AI extraction?",
      answer: "Clear headings, concise answer blocks, and supporting schema make it easier for machines to identify the right passage and its context.",
      citation_ids: ["schema-org"],
    },
    {
      question: "Does schema guarantee citations?",
      answer: "No. Schema helps machines interpret page meaning, but source quality and content clarity still matter.",
      citation_ids: ["schema-org"],
    },
    {
      question: "What makes a page more citable?",
      answer: "Specific claims, traceable sourcing, and direct answers make a page more reusable in search and AI interfaces.",
      citation_ids: ["google-ai-overviews"],
    },
    {
      question: "How many internal links should a strong post include?",
      answer: "At least a few relevant internal links help users and reinforce topic relationships across the site.",
      citation_ids: ["google-ai-overviews"],
    },
  ],
  conclusion: [
    {
      text: "The strongest modern content systems combine search fundamentals, source discipline, and structured output.",
      citation_ids: ["google-ai-overviews"],
    },
  ],
  suggested_internal_links: [
    {
      anchor: "AI visibility workflows",
      url: "/workflows/ai-visibility",
      rationale: "Supports readers exploring implementation.",
    },
    {
      anchor: "How to plan a group trip",
      url: "/blog/how-to-plan-a-group-trip",
      rationale: "Connects the concept to a practical TRYPS use case.",
    },
    {
      anchor: "How to split expenses on a group trip",
      url: "/blog/how-to-split-expenses-group-trip",
      rationale: "Supports readers looking for real-world coordination workflows.",
    },
  ],
  call_to_action: {
    label: "See TRYPS",
    url: "https://jointryps.com/start",
    text: "Explore how <strong>TRYPS</strong> helps groups coordinate dates, plans, and costs without the usual mess.",
  },
};

describe("blog writer helpers", () => {
  it("normalizes invalid citations and reports unused sources", () => {
    const normalized = normalizeDraftAgainstSources(draft, request.sources, request.article.slug);

    expect(normalized.draft.sections[0]?.paragraphs[0]?.citation_ids).toEqual([
      "google-ai-overviews",
    ]);
    expect(normalized.warnings.some((warning) => warning.includes("unknown"))).toBe(true);
    expect(normalized.uncited_source_ids).toEqual([]);
  });

  it("builds BlogPosting and FAQ schema graph", () => {
    const normalized = normalizeDraftAgainstSources(draft, request.sources, request.article.slug);
    const jsonLd = buildBlogJsonLd(request, normalized.draft);
    const graph = (jsonLd["@graph"] as Array<Record<string, unknown>>) ?? [];

    expect(graph.some((node) => node["@type"] === "BlogPosting")).toBe(true);
    expect(graph.some((node) => node["@type"] === "FAQPage")).toBe(true);
    expect(graph.some((node) => node["@type"] === "BreadcrumbList")).toBe(true);
    expect(graph.some((node) => node["@type"] === "WebPage")).toBe(true);
  });

  it("renders HTML with embedded schema and reference anchors", () => {
    const normalized = normalizeDraftAgainstSources(draft, request.sources, request.article.slug);
    const jsonLd = buildBlogJsonLd(request, normalized.draft);
    const html = renderBlogHtml(request, normalized.draft, jsonLd);

    expect(html).toContain('class="quick-answer"');
    expect(html).toContain('class="summary-box"');
    expect(html).toContain('class="faq-a"');
    expect(html).toContain('class="sr-only skip-link"');
    expect(html).toContain('<script type="application/ld+json">');
    expect(html).toContain('id="source-google-ai-overviews"');
    expect(html).toContain('property="og:locale" content="en_US"');
    expect(html).toContain('property="twitter:site" content="@trypsapp"');
    expect(html).toContain('data-primary-keyword="answer engine optimization"');
  });
});

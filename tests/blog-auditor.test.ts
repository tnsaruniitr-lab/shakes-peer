import { describe, expect, it } from "vitest";
import { auditBlogPackage } from "../src/blog/auditor.js";
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
  meta_description: "Learn what answer engine optimization means, how it differs from SEO, and how to publish more citable content for AI search.",
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
      text: "Answer engine optimization is the practice of making content easier for search and AI systems to understand, extract, and cite in 2026 search experiences.",
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
      heading: "Why does answer engine optimization matter now?",
      purpose: "Explain why AI-driven search changes content requirements.",
      paragraphs: [
        {
          text: "AI-mediated results often compress content into direct answers, which increases the value of pages that are explicit, well-structured, and source-backed. Teams that publish generic pages without source discipline are more likely to be skipped when answer engines choose passages to reuse.",
          citation_ids: ["google-ai-overviews"],
        },
        {
          text: "A practical operating model is to lead each section with a crisp answer, follow it with evidence, and then give the reader a concrete next step. That makes the page easier for people to skim and easier for machines to extract.",
          citation_ids: ["google-ai-overviews"],
        },
      ],
      bullets: [
        "Structure answers clearly",
        "Support factual claims with sources",
        "Separate summary blocks from long analysis",
      ],
    },
    {
      heading: "How does schema support extraction?",
      purpose: "Show why machine-readable metadata matters.",
      paragraphs: [
        {
          text: "Schema.org defines BlogPosting as structured metadata for online blog articles, which helps systems understand page type and content attributes. FAQPage and BreadcrumbList add more machine-readable context about intent, answer blocks, and page structure.",
          citation_ids: ["schema-org"],
        },
        {
          text: "When the page includes clear JSON-LD, headings, and references, retrieval systems can connect the visible answer with the underlying entities and evidence more reliably.",
          citation_ids: ["schema-org", "google-ai-overviews"],
        },
      ],
      bullets: ["Use BlogPosting for the main article", "Add FAQPage only when FAQs are visible"],
    },
    {
      heading: "What should a strong AEO workflow include?",
      purpose: "Give the reader a practical framework they can implement.",
      paragraphs: [
        {
          text: "A useful workflow has 3 layers: source gathering, structured drafting, and final audit. Each layer should preserve citations so the final page can show where claims came from and how the article was shaped for answer extraction.",
          citation_ids: ["google-ai-overviews", "schema-org"],
        },
        {
          text: "For example, a team might collect source notes on Monday, draft an article on Tuesday, and run a release audit before publishing. That turns a vague content process into a repeatable checklist.",
          citation_ids: ["google-ai-overviews"],
        },
      ],
      bullets: ["Gather evidence first", "Draft in answer-ready blocks", "Audit HTML and schema before publish"],
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
      text: "The strongest modern content systems combine search fundamentals, source discipline, and structured output so both readers and machines can trust what they find.",
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
    text: "Explore how TRYPS helps groups coordinate dates, plans, and costs without the usual mess.",
  },
};

describe("blog auditor", () => {
  it("scores a complete blog package and reports iteration deltas", () => {
    const normalized = normalizeDraftAgainstSources(draft, request.sources, request.article.slug);
    const jsonLd = buildBlogJsonLd(request, normalized.draft);
    const html = renderBlogHtml(request, normalized.draft, jsonLd);

    const audit = auditBlogPackage({
      request: {
        topic: request.topic,
        primary_keyword: request.primary_keyword,
        secondary_keywords: request.secondary_keywords,
        search_intent: request.search_intent,
        brand_name: request.brand.name,
        canonical_url: "https://jointryps.com/what-is-answer-engine-optimization",
        source_count: request.sources.length,
      },
      article: normalized.draft,
      html,
      json_ld: jsonLd,
      references: request.sources,
      validation: normalized,
      iteration: {
        previous_score: 68,
        previous_failed_checks: ["A5", "D6"],
        fixes_applied: ["D6"],
      },
    });

    expect(audit.detected_format.value).toBe("article");
    expect(audit.summary.overall_score).not.toBeNull();
    expect((audit.summary.overall_score ?? 0) >= 75).toBe(true);
    expect(audit.summary.score_delta_vs_previous).toBeGreaterThan(0);
    expect(audit.summary.previously_failed_now_passing).toContain("D6");
    expect(audit.sections.find((section) => section.id === "D")?.fail_count).toBe(0);
  });

  it("marks missing HTML and JSON-LD checks as unverifiable instead of failing them", () => {
    const audit = auditBlogPackage({
      request: {
        primary_keyword: request.primary_keyword,
        brand_name: request.brand.name,
      },
      article: draft,
      references: request.sources,
    });

    expect(audit.input_coverage.html).toBe(false);
    expect(audit.input_coverage.json_ld).toBe(false);
    expect(audit.sections.find((section) => section.id === "C")?.unverifiable_count).toBeGreaterThan(0);
    expect(audit.sections.find((section) => section.id === "D")?.unverifiable_count).toBeGreaterThan(0);
    expect(audit.fix_summary.some((item) => item.section_id === "C")).toBe(false);
  });
});

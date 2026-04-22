import { describe, expect, it } from "vitest";
import { renderBlogMarkdown } from "../src/blog/markdown.js";
import type { BlogDraft, BlogWriterRequest } from "../src/blog/types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests for the canonical markdown render.
//
// The markdown is the portable source of truth, so these tests pin the
// structural invariants — front-matter keys, section headings, footnote
// citations. Changes that break any of these break downstream consumers
// (CMS importers, static site generators, migration scripts).
// ─────────────────────────────────────────────────────────────────────────────

const baseRequest: BlogWriterRequest = {
  topic: "What is answer engine optimization?",
  primary_keyword: "answer engine optimization",
  secondary_keywords: ["AEO", "AI search visibility"],
  search_intent: "informational",
  audience: "SaaS marketing leaders",
  angle: "Clear explainer of AEO for teams that own AI-visible content systems.",
  post_format: "article",
  enforce_human_signals: false,
  first_party_data: [],
  named_examples: [],
  original_visuals: [],
  brand: {
    name: "AnswerMonk",
    domain: "answermonk.ai",
    product_name: "AI Visibility Audit",
    product_description: "Measures brand visibility in ChatGPT, Gemini, Claude, Perplexity.",
    tone_of_voice: "analytical, authoritative, practical",
    differentiators: ["Multi-engine coverage", "Category buyer prompts"],
  },
  sources: [
    {
      id: "openai-docs",
      title: "OpenAI ChatGPT Search Documentation",
      url: "https://platform.openai.com/docs/guides/search",
      publisher: "OpenAI",
      excerpt: "ChatGPT Search cites sources in generated responses.",
      authority_tier: "primary",
    },
    {
      id: "geo-arxiv",
      title: "GEO: Generative Engine Optimization",
      url: "https://arxiv.org/abs/2311.09735",
      publisher: "arXiv",
      excerpt: "GEO is a novel paradigm to aid content visibility in generative engines.",
      authority_tier: "primary",
    },
  ],
  article: {
    slug: "answer-engine-optimization",
    target_word_count: 1800,
    include_faq: true,
    include_howto_schema: false,
    include_comparison_table: false,
    author_name: "AnswerMonk Research",
    category: "Glossary",
    next_review_date: "2026-07-22",
  },
  model: "gpt-4.1",
};

const baseDraft: BlogDraft = {
  title: "What is Answer Engine Optimization?",
  slug: "answer-engine-optimization",
  meta_title: "What is AEO? | AnswerMonk",
  meta_description:
    "Answer Engine Optimization (AEO) is the discipline of making content visible in ChatGPT, Gemini, Claude, and Perplexity.",
  excerpt: "A practical definition of AEO and how it differs from SEO and GEO.",
  format: "article",
  breadcrumbs: [
    { label: "Blog", url: "/blog" },
    { label: "Glossary", url: "/blog/glossary" },
    { label: "AEO", url: "/blog/glossary/answer-engine-optimization" },
  ],
  quick_answer: [
    "AEO is the process of optimizing content for AI answer engines.",
    "It focuses on structured data, citations, and extractable answers.",
    "Measured via share-of-voice in ChatGPT, Gemini, Claude, and Perplexity.",
  ],
  intro: [
    {
      text: "AEO sits between classic SEO and emerging GEO practices.",
      citation_ids: ["openai-docs"],
    },
  ],
  key_takeaways: [
    "AEO targets AI answer engines, not classic search.",
    "Primary tactics: schema, citations, specific answers.",
    "Measurement: share-of-voice across engines.",
  ],
  sections: [
    {
      heading: "What is AEO exactly?",
      purpose: "Defines the term precisely.",
      paragraphs: [
        {
          text: "AEO stands for Answer Engine Optimization.",
          citation_ids: ["geo-arxiv"],
        },
      ],
      bullets: ["Structured data", "Clear answers", "Primary citations"],
    },
    {
      heading: "How does AEO differ from SEO?",
      purpose: "Compares AEO and SEO concretely.",
      paragraphs: [
        {
          text: "AEO targets AI engines; SEO targets search result pages.",
          citation_ids: ["openai-docs"],
        },
      ],
      bullets: [],
    },
    {
      heading: "Why does AEO matter now?",
      purpose: "Explains the business stakes.",
      paragraphs: [
        {
          text: "AI engines increasingly replace classic search for buyer research.",
          citation_ids: [],
        },
      ],
      bullets: [],
    },
  ],
  summary_box: [
    "AEO optimises for AI answer engines.",
    "Structured data + citations + specifics are the core tactics.",
    "Measurement happens via share-of-voice across engines.",
  ],
  faq: [
    {
      question: "Is AEO different from SEO?",
      answer: "Yes — AEO targets AI answer engines, SEO targets search result pages.",
      citation_ids: ["openai-docs"],
    },
  ],
  conclusion: [
    {
      text: "AEO is the next layer of content strategy for AI-first search.",
      citation_ids: [],
    },
  ],
  suggested_internal_links: [],
  call_to_action: {
    label: "Run your free AEO audit",
    url: "https://answermonk.ai",
    text: "See how your brand appears across AI engines.",
  },
  first_party_data_anchors: [],
  stance_in_body: "",
};

describe("renderBlogMarkdown", () => {
  it("produces valid front-matter with required keys", () => {
    const md = renderBlogMarkdown(baseRequest, baseDraft);
    const fm = md.match(/^---\n([\s\S]*?)\n---/);
    expect(fm).not.toBeNull();
    const fmText = fm![1];
    for (const key of [
      "title:",
      "slug:",
      "brand:",
      "category:",
      "primary_keyword:",
      "secondary_keywords:",
      "search_intent:",
      "post_format:",
      "meta_title:",
      "meta_description:",
      "excerpt:",
      "published_at:",
      "modified_at:",
      "next_review_date:",
    ]) {
      expect(fmText).toContain(key);
    }
  });

  it("writes the H1 title after the front-matter", () => {
    const md = renderBlogMarkdown(baseRequest, baseDraft);
    const afterFm = md.split(/^---\n([\s\S]*?)\n---\n\n/m)[2];
    expect(afterFm).toMatch(/^# What is Answer Engine Optimization\?/);
  });

  it("emits Quick answer, Key takeaways, Summary, FAQ, Conclusion sections", () => {
    const md = renderBlogMarkdown(baseRequest, baseDraft);
    expect(md).toContain("## Quick answer");
    expect(md).toContain("## Introduction");
    expect(md).toContain("## Key takeaways");
    expect(md).toContain("## Summary");
    expect(md).toContain("## Frequently asked questions");
    expect(md).toContain("## Conclusion");
    expect(md).toContain("## Next step");
  });

  it("renders every section heading from the draft", () => {
    const md = renderBlogMarkdown(baseRequest, baseDraft);
    for (const section of baseDraft.sections) {
      expect(md).toContain(`## ${section.heading}`);
    }
  });

  it("emits footnote citations and a References block", () => {
    const md = renderBlogMarkdown(baseRequest, baseDraft);
    expect(md).toContain("[^openai-docs]");
    expect(md).toContain("[^geo-arxiv]");
    expect(md).toContain("## References");
    expect(md).toContain(
      "[^openai-docs]: OpenAI ChatGPT Search Documentation — https://platform.openai.com/docs/guides/search — (OpenAI)"
    );
  });

  it("renders the editorial stance as a blockquote when provided", () => {
    const req: BlogWriterRequest = {
      ...baseRequest,
      editorial_stance: {
        claim: "AEO and SEO are converging into one discipline.",
        supporting_reasoning:
          "The same content signals drive visibility across AI engines and classic search.",
      },
    };
    const md = renderBlogMarkdown(req, baseDraft);
    expect(md).toContain("> **Our take** — AEO and SEO are converging into one discipline.");
  });

  it("includes the author section and LinkedIn link when author is provided", () => {
    const req: BlogWriterRequest = {
      ...baseRequest,
      author: {
        name: "Arun Sharma",
        title: "Founder, AnswerMonk",
        bio: "Builds GEO intelligence at AnswerMonk and writes about AI search visibility for B2B brands.",
        linkedin_url: "https://www.linkedin.com/in/arunsharma-answermonk",
        expertise_keywords: ["AEO", "GEO", "AI visibility"],
      },
    };
    const md = renderBlogMarkdown(req, baseDraft);
    expect(md).toContain("## About the author");
    expect(md).toContain("[LinkedIn](https://www.linkedin.com/in/arunsharma-answermonk)");
    expect(md).toContain("Writes about: AEO, GEO, AI visibility");
    // Author front-matter block rendered too
    expect(md).toContain("author:");
    expect(md).toContain("  name: Arun Sharma");
  });

  it("includes the editorial integrity checklist when passed", () => {
    const md = renderBlogMarkdown(baseRequest, baseDraft, {
      editorial_checklist: [
        { id: "author", label: "Named author with LinkedIn", pass: true, detail: "Arun Sharma" },
        { id: "reviewer", label: "Editorial reviewer", pass: false, detail: "Not reviewed" },
      ],
    });
    expect(md).toContain("## Editorial integrity checklist");
    expect(md).toContain("- ✅ **Named author with LinkedIn** — Arun Sharma");
    expect(md).toContain("- ❌ **Editorial reviewer** — Not reviewed");
  });
});

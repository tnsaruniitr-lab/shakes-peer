import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  buildAuditOptions,
  extractArticleBody,
  extractMetaTags,
  toBloggerPost,
  unwrapJsonLdGraph,
} from "../src/blog/blog-buster-adapter.js";
import type {
  BlogDraft,
  BlogWriterRequest,
  BlogWriterResponse,
} from "../src/blog/types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests for the Shakes-peer ↔ Blog-buster adapter.
//
// Three concerns:
//   1. extract helpers do what their names claim on real HTML
//   2. toBloggerPost produces a valid BloggerPost for a canonical response
//   3. buildAuditOptions enforces the filesystem-policy defaults (no repo
//      publish, no local publish, no git commits — per contract §11)
// ─────────────────────────────────────────────────────────────────────────────

function minimalDraft(): BlogDraft {
  return {
    title: "Test Title",
    slug: "test-title",
    meta_title: "Test Title | Brand",
    meta_description: "A test meta description for adapter tests.",
    excerpt: "Short test excerpt.",
    format: "article",
    breadcrumbs: [
      { label: "Blog", url: "/blog" },
      { label: "Test", url: "/blog/test-title" },
    ],
    quick_answer: ["First bullet.", "Second bullet.", "Third bullet."],
    intro: [{ text: "Intro paragraph.", citation_ids: [] }],
    key_takeaways: ["Takeaway one.", "Takeaway two.", "Takeaway three."],
    sections: [
      {
        heading: "Section One",
        purpose: "Explains thing one.",
        paragraphs: [{ text: "Body of section one.", citation_ids: [] }],
        bullets: ["Bullet one."],
      },
      {
        heading: "Section Two",
        purpose: "Explains thing two.",
        paragraphs: [{ text: "Body of section two.", citation_ids: [] }],
        bullets: [],
      },
      {
        heading: "Section Three",
        purpose: "Closes the arc.",
        paragraphs: [{ text: "Body of section three.", citation_ids: [] }],
        bullets: [],
      },
    ],
    summary_box: ["Summary one.", "Summary two.", "Summary three."],
    faq: [
      {
        question: "What is the test?",
        answer: "A deterministic adapter unit test.",
        citation_ids: [],
      },
    ],
    conclusion: [{ text: "Concluding sentence that wraps things up.", citation_ids: [] }],
    suggested_internal_links: [],
    call_to_action: {
      label: "Try it",
      url: "https://example.com/start",
      text: "Run the test.",
    },
    first_party_data_anchors: [],
    stance_in_body: "",
  };
}

function minimalRequest(): BlogWriterRequest {
  return {
    topic: "Adapter test topic",
    primary_keyword: "adapter test",
    secondary_keywords: ["integration test", "smoke test"],
    search_intent: "informational",
    audience: "developers",
    angle: "verify adapter output",
    post_format: "article",
    enforce_human_signals: false,
    first_party_data: [],
    named_examples: [],
    original_visuals: [],
    brand: {
      name: "TestBrand",
      domain: "testbrand.example.com",
      product_description: "A test brand for adapter unit testing.",
      tone_of_voice: "clear, direct",
      differentiators: ["Differentiator one."],
    },
    sources: [
      {
        id: "src1",
        title: "Source One",
        url: "https://example.com/src1",
        publisher: "Example",
        excerpt: "Some excerpt.",
        authority_tier: "primary",
      },
    ],
    article: {
      slug: "test-title",
      target_word_count: 1800,
      include_faq: true,
      include_howto_schema: false,
      include_comparison_table: false,
      author_name: "Test Author",
      category: "Testing",
    },
    model: "gpt-4.1",
  };
}

function minimalResponse(html: string, jsonLd: Record<string, unknown>): BlogWriterResponse {
  return {
    request: {
      topic: "Adapter test topic",
      primary_keyword: "adapter test",
      secondary_keywords: ["integration test"],
      search_intent: "informational",
      brand_name: "TestBrand",
      canonical_url: "https://testbrand.example.com/test-title",
      source_count: 1,
      human_signals_enforced: false,
      primary_source_count: 1,
      first_party_data_count: 0,
      named_examples_count: 0,
      original_visuals_count: 0,
      has_editorial_stance: false,
      has_author_entity: false,
    },
    article: minimalDraft(),
    html,
    preview_html: html,
    json_ld: jsonLd,
    json_ld_string: JSON.stringify(jsonLd),
    references: [],
    validation: {
      warnings: [],
      uncited_source_ids: [],
      human_signal_gaps: [],
      pending_visual_placements: [],
    },
    editorial_checklist: [],
    checklist_passed: 0,
    checklist_total: 0,
    publish_ready: true,
  };
}

describe("extractArticleBody", () => {
  it("returns inner HTML of the first <article> when present", () => {
    const html = `<html><body><header>nav</header><article><h1>Hi</h1><p>Body.</p></article><footer>f</footer></body></html>`;
    const body = extractArticleBody(html);
    expect(body).toContain("<h1>Hi</h1>");
    expect(body).toContain("<p>Body.</p>");
    expect(body).not.toContain("nav");
    expect(body).not.toContain("footer");
  });

  it("falls back to <main> when no <article>", () => {
    const html = `<html><body><main><h2>Section</h2><p>Content</p></main></body></html>`;
    const body = extractArticleBody(html);
    expect(body).toContain("<h2>Section</h2>");
  });

  it("falls back to <body> when no <article> or <main>", () => {
    const html = `<html><body><div>Raw content</div></body></html>`;
    const body = extractArticleBody(html);
    expect(body).toContain("Raw content");
  });

  it("returns the whole html when even <body> is absent", () => {
    const html = `<div>Fragment</div>`;
    const body = extractArticleBody(html);
    expect(body).toContain("Fragment");
  });
});

describe("extractMetaTags", () => {
  it("extracts title, canonical, description, og:*, twitter:*", () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Test Page</title>
  <meta name="description" content="Desc here.">
  <meta property="og:title" content="OG Title">
  <meta property="og:description" content="OG Desc">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="https://example.com/page">
</head>
<body></body>
</html>`;
    const meta = extractMetaTags(html);
    expect(meta.title).toBe("Test Page");
    expect(meta.description).toBe("Desc here.");
    expect(meta["og:title"]).toBe("OG Title");
    expect(meta["og:description"]).toBe("OG Desc");
    expect(meta["twitter:card"]).toBe("summary_large_image");
    expect(meta.canonical).toBe("https://example.com/page");
  });

  it("ignores meta tags without a usable key or content", () => {
    const html = `<html><head><meta><meta name="empty"></head></html>`;
    const meta = extractMetaTags(html);
    expect(meta).toEqual({});
  });

  it("first wins when the same key appears twice", () => {
    const html = `<html><head>
      <meta property="og:title" content="First">
      <meta property="og:title" content="Second">
    </head></html>`;
    const meta = extractMetaTags(html);
    expect(meta["og:title"]).toBe("First");
  });
});

describe("unwrapJsonLdGraph", () => {
  it("unwraps @graph and propagates @context to each node", () => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "Organization", name: "Brand" },
        { "@type": "BlogPosting", headline: "Title" },
      ],
    };
    const out = unwrapJsonLdGraph(jsonLd);
    expect(out).toHaveLength(2);
    expect((out[0] as Record<string, unknown>)["@type"]).toBe("Organization");
    expect((out[0] as Record<string, unknown>)["@context"]).toBe("https://schema.org");
    expect((out[1] as Record<string, unknown>)["@context"]).toBe("https://schema.org");
  });

  it("does not overwrite an @context already on a graph node", () => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        { "@context": "https://custom.example/", "@type": "Custom", name: "X" },
      ],
    };
    const out = unwrapJsonLdGraph(jsonLd);
    expect((out[0] as Record<string, unknown>)["@context"]).toBe("https://custom.example/");
  });

  it("passes through an already-flat array", () => {
    const arr = [{ "@type": "BlogPosting", headline: "Hi" }];
    expect(unwrapJsonLdGraph(arr)).toBe(arr);
  });

  it("wraps a single entity (no @graph, with @type) into a one-element array", () => {
    const single = { "@context": "https://schema.org", "@type": "BlogPosting", headline: "Hi" };
    const out = unwrapJsonLdGraph(single);
    expect(out).toHaveLength(1);
    expect((out[0] as Record<string, unknown>)["@type"]).toBe("BlogPosting");
  });

  it("returns [] for null, undefined, or plain objects without @graph/@type", () => {
    expect(unwrapJsonLdGraph(null)).toEqual([]);
    expect(unwrapJsonLdGraph(undefined)).toEqual([]);
    expect(unwrapJsonLdGraph({ something: "else" })).toEqual([]);
  });
});

describe("toBloggerPost", () => {
  it("produces a BloggerPost with all required fields populated", () => {
    const html = `<html><head><title>Test</title></head>
      <body><article><h1>Hi</h1><p>Body.</p></article></body></html>`;
    const jsonLd = { "@context": "https://schema.org", "@graph": [{ "@type": "BlogPosting" }] };
    const response = minimalResponse(html, jsonLd);
    const request = minimalRequest();

    const bp = toBloggerPost({ request, response });

    expect(bp.slug).toBe("test-title");
    expect(bp.brand.name).toBe("TestBrand");
    expect(bp.brand.website).toBe("https://testbrand.example.com");
    expect(bp.html).toBe(html);
    expect(bp.articleBodyHtml).toContain("<h1>Hi</h1>");
    expect(bp.articleBodyHtml).not.toContain("<head>");
    expect(bp.jsonLdSchemas).toHaveLength(1);
    expect(bp.metaTags?.title).toBe("Test");
    expect(bp.topic).toBe("Adapter test topic");
    expect(bp.primaryKeyword).toBe("adapter test");
    expect(bp.secondaryKeywords).toEqual(["integration test", "smoke test"]);
    expect(bp.format).toBe("article");
    expect(typeof bp.wordCount).toBe("number");
    expect(bp.wordCount).toBeGreaterThan(0);
  });

  it("is deterministic — same inputs produce identical output", () => {
    const html = `<html><body><article><p>Text</p></article></body></html>`;
    const jsonLd = { "@context": "https://schema.org", "@graph": [] };
    const request = minimalRequest();
    const response = minimalResponse(html, jsonLd);

    const first = toBloggerPost({ request, response });
    const second = toBloggerPost({ request, response });

    expect(first).toEqual(second);
  });

  it("maps how_to post_format to 'how-to' hint for blog-buster", () => {
    const request = { ...minimalRequest(), post_format: "how_to" as const };
    const response = minimalResponse("<html><body><article><p>P</p></article></body></html>", {});
    const bp = toBloggerPost({ request, response });
    expect(bp.format).toBe("how-to");
  });
});

describe("buildAuditOptions", () => {
  it("enforces the handshake filesystem policy (no publishing)", () => {
    const html = `<html><body><article><p>Body</p></article></body></html>`;
    const opts = buildAuditOptions({
      request: minimalRequest(),
      response: minimalResponse(html, {}),
      repoRoot: "/tmp/repo",
      outputDir: "/tmp/cache",
    });

    expect(opts.publishToLocal).toBe(false);
    expect(opts.publishToRepo).toBe(false);
    expect(opts.commit).toBe(false);
    expect(opts.repoRoot).toBe("/tmp/repo");
    expect(opts.outputDir).toBe("/tmp/cache");
    expect(opts.runLlmLayers).toBe(true);
    expect(opts.targetScore).toBe(90);
    expect(opts.generatedPost?.slug).toBe("test-title");
  });

  it("respects overrides for runLlmLayers and targetScore", () => {
    const html = `<html><body><article><p>Body</p></article></body></html>`;
    const opts = buildAuditOptions({
      request: minimalRequest(),
      response: minimalResponse(html, {}),
      repoRoot: "/tmp/repo",
      outputDir: "/tmp/cache",
      runLlmLayers: false,
      targetScore: 85,
    });

    expect(opts.runLlmLayers).toBe(false);
    expect(opts.targetScore).toBe(85);
  });
});

describe("round-trip: real Shakes-peer package → BloggerPost", () => {
  const PACKAGE_PATH = path.resolve(
    __dirname,
    "..",
    "examples",
    "generated",
    "answermonk-aeo-glossary-v3.package.json"
  );

  it("builds a valid BloggerPost from the committed answermonk v3 package", () => {
    if (!fs.existsSync(PACKAGE_PATH)) {
      console.warn(`Skipping — fixture not present at ${PACKAGE_PATH}`);
      return;
    }

    const pkg = JSON.parse(fs.readFileSync(PACKAGE_PATH, "utf-8"));
    const response = pkg as BlogWriterResponse;

    // Reconstruct a minimal request from what's in the package.
    const request: BlogWriterRequest = {
      ...minimalRequest(),
      topic: pkg.request.topic ?? "Topic",
      primary_keyword: pkg.request.primary_keyword,
      secondary_keywords: pkg.request.secondary_keywords ?? [],
      search_intent: pkg.request.search_intent ?? "informational",
      brand: {
        name: pkg.request.brand_name,
        domain: new URL(pkg.request.canonical_url).hostname,
        product_description: "Test.",
        tone_of_voice: "clear",
        differentiators: [],
      },
      sources: pkg.references ?? [],
      article: {
        ...minimalRequest().article,
        slug: pkg.article.slug,
      },
    };

    const bp = toBloggerPost({ request, response });

    // Structural invariants
    expect(bp.slug).toBe(pkg.article.slug);
    expect(bp.html).toBe(pkg.html);
    expect(bp.articleBodyHtml).toBeTruthy();
    expect(bp.articleBodyHtml!.length).toBeGreaterThan(500);
    expect(bp.articleBodyHtml!.length).toBeLessThan(bp.html.length);
    expect(Array.isArray(bp.jsonLdSchemas)).toBe(true);
    expect(bp.jsonLdSchemas!.length).toBeGreaterThan(0);
    expect(bp.metaTags?.title).toBeTruthy();
    expect(bp.metaTags?.canonical).toBeTruthy();
    expect(bp.wordCount).toBeGreaterThan(100);
  });
});

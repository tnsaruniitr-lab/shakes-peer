import { describe, it, expect } from "vitest";
import {
  SYNTHESIZERS,
  hasSynthesizer,
  type SynthesisContext,
} from "../../src/handlers/synthesize-content.js";
import type { HandlerState, Instruction } from "../../src/handlers/types.js";

const baseInstr = (check_id: string, action: Instruction["action"] = "insert_missing"): Instruction => ({
  check_id,
  severity: "fail",
  layer: "technical",
  evidence: "missing",
  action,
});

function ctx(overrides: Partial<SynthesisContext> = {}): SynthesisContext {
  return {
    request: {
      primary_keyword: "answer engine optimization",
      topic: "What is AEO",
      brand: { name: "AnswerMonk", domain: "answermonk.ai" },
      // deliberately minimal — synthesizers only read a few fields
    } as unknown as SynthesisContext["request"],
    source: {
      article: {
        intro: [
          { text: "Answer engine optimization is the practice of shaping content so AI systems quote it directly. It builds on SEO but targets generative answers." },
          { text: "Brands that win AEO treat the AI as the reader." },
        ],
      },
    } as unknown as SynthesisContext["source"],
    runLlm: false,
    ...overrides,
  };
}

describe("hasSynthesizer", () => {
  it("lists the covered check_ids", () => {
    expect(hasSynthesizer("S_tldr_missing")).toBe(true);
    expect(hasSynthesizer("S_missing_DefinedTerm_schema")).toBe(true);
    expect(hasSynthesizer("P_faq_count_mismatch")).toBe(true);
    expect(hasSynthesizer("S_word_count_above_band")).toBe(true);
    expect(hasSynthesizer("D_Organization_missing_recommended")).toBe(true);
    expect(hasSynthesizer("D_WebPage_missing_recommended")).toBe(true);
    expect(hasSynthesizer("S_visible_last_updated_missing")).toBe(true);
    expect(hasSynthesizer("E_author_credentials_missing")).toBe(true);
    expect(hasSynthesizer("random_other")).toBe(false);
  });
});

describe("Last-updated synthesizer", () => {
  it("injects a canonical last-updated stamp after <h1>", async () => {
    const state: HandlerState = {
      html: `<article><h1>Guide</h1><p>body</p></article>`,
      jsonLd: [],
      metaTags: {},
    };
    const r = await SYNTHESIZERS.S_visible_last_updated_missing!(
      state,
      baseInstr("S_visible_last_updated_missing"),
      ctx(),
    );
    expect(r.outcome).toBe("applied");
    expect(r.html).toMatch(/<p class="last-updated"[^>]*>Last updated: <time/);
  });

  it("skips when a last-updated phrase already exists", async () => {
    const state: HandlerState = {
      html: `<article><h1>X</h1><p>Last updated: April 1</p></article>`,
      jsonLd: [],
      metaTags: {},
    };
    const r = await SYNTHESIZERS.S_visible_last_updated_missing!(
      state,
      baseInstr("S_visible_last_updated_missing"),
      ctx(),
    );
    expect(r.outcome).toBe("skipped");
  });
});

describe("Author credentials synthesizer", () => {
  it("renders an author bio block when brief has title + bio", async () => {
    const state: HandlerState = {
      html: `<article><h1>x</h1><p>body</p></article>`,
      jsonLd: [],
      metaTags: {},
    };
    const r = await SYNTHESIZERS.E_author_credentials_missing!(
      state,
      baseInstr("E_author_credentials_missing"),
      ctx({
        request: {
          primary_keyword: "x",
          topic: "y",
          brand: { name: "AnswerMonk", domain: "answermonk.ai" },
          author: {
            name: "Priya Das",
            title: "Head of Content",
            bio: "Ten years writing about search and AEO.",
          },
        } as unknown as SynthesisContext["request"],
      }),
    );
    expect(r.outcome).toBe("applied");
    expect(r.html).toContain(`class="author-bio"`);
    expect(r.html).toContain("Priya Das");
    expect(r.html).toContain("Head of Content");
  });

  it("escalates when title and bio are both absent", async () => {
    const state: HandlerState = {
      html: `<article><h1>x</h1></article>`,
      jsonLd: [],
      metaTags: {},
    };
    const r = await SYNTHESIZERS.E_author_credentials_missing!(
      state,
      baseInstr("E_author_credentials_missing"),
      ctx({
        request: {
          primary_keyword: "x",
          topic: "y",
          brand: { name: "A", domain: "a.com" },
          author: { name: "Name Only" },
        } as unknown as SynthesisContext["request"],
      }),
    );
    expect(r.outcome).toBe("escalated");
  });
});

describe("Organization synthesizer", () => {
  it("appends an Organization built from brand metadata", async () => {
    const state: HandlerState = { html: "", jsonLd: [], metaTags: {} };
    const r = await SYNTHESIZERS.D_Organization_missing_recommended!(
      state,
      baseInstr("D_Organization_missing_recommended"),
      ctx(),
    );
    expect(r.outcome).toBe("applied");
    const graph = (r.jsonLd as { "@graph": unknown[] })["@graph"] ?? r.jsonLd;
    const list = Array.isArray(graph) ? graph : [graph];
    const org = list.find((n) => (n as Record<string, unknown>)["@type"] === "Organization") as Record<string, unknown>;
    expect(org.name).toBe("AnswerMonk");
    expect(String(org.url)).toContain("answermonk.ai");
    // Handshake contract §7a — recommended fields must be present even if empty.
    expect(Array.isArray(org.sameAs)).toBe(true);
    expect(org.contactPoint).toBeTruthy();
    expect((org.contactPoint as Record<string, unknown>)["@type"]).toBe("ContactPoint");
  });
});

describe("WebPage synthesizer", () => {
  it("appends a WebPage built from brand + article slug", async () => {
    const state: HandlerState = { html: "", jsonLd: [], metaTags: { "og:title": "AEO Guide" } };
    const r = await SYNTHESIZERS.D_WebPage_missing_recommended!(
      state,
      baseInstr("D_WebPage_missing_recommended"),
      ctx({
        source: {
          article: { slug: "what-is-aeo", intro: [] },
        } as unknown as SynthesisContext["source"],
      }),
    );
    expect(r.outcome).toBe("applied");
    const graph = (r.jsonLd as { "@graph": unknown[] })["@graph"] ?? r.jsonLd;
    const list = Array.isArray(graph) ? graph : [graph];
    const wp = list.find((n) => (n as Record<string, unknown>)["@type"] === "WebPage") as Record<string, unknown>;
    expect(String(wp.url)).toContain("what-is-aeo");
    expect(wp.name).toBe("AEO Guide");
    // Handshake contract §7a — recommended fields.
    expect(typeof wp.dateModified).toBe("string");
    expect(wp.inLanguage).toBe("en-US");
  });

  it("includes primaryImageOfPage when og:image is present", async () => {
    const state: HandlerState = {
      html: "",
      jsonLd: [],
      metaTags: { "og:image": "https://cdn.example/cover.jpg" },
    };
    const r = await SYNTHESIZERS.D_WebPage_missing_recommended!(
      state,
      baseInstr("D_WebPage_missing_recommended"),
      ctx({
        source: { article: { slug: "x", intro: [] } } as unknown as SynthesisContext["source"],
      }),
    );
    const graph = (r.jsonLd as { "@graph": unknown[] })["@graph"] ?? r.jsonLd;
    const list = Array.isArray(graph) ? graph : [graph];
    const wp = list.find((n) => (n as Record<string, unknown>)["@type"] === "WebPage") as Record<string, unknown>;
    const img = wp.primaryImageOfPage as Record<string, unknown>;
    expect(img["@type"]).toBe("ImageObject");
    expect(img.url).toBe("https://cdn.example/cover.jpg");
  });

  it("skips when no domain context is available", async () => {
    const state: HandlerState = { html: "", jsonLd: [], metaTags: {} };
    const r = await SYNTHESIZERS.D_WebPage_missing_recommended!(
      state,
      baseInstr("D_WebPage_missing_recommended"),
      ctx({
        request: {
          primary_keyword: "x",
          brand: { name: "X" },
        } as unknown as SynthesisContext["request"],
        source: { article: { slug: "", intro: [] } } as unknown as SynthesisContext["source"],
      }),
    );
    expect(r.outcome).toBe("skipped");
  });
});

describe("TL;DR synthesizer", () => {
  it("inserts a TL;DR aside after <h1> in deterministic mode", async () => {
    const state: HandlerState = {
      html: `<article><h1>AEO Guide</h1><p>body</p></article>`,
      jsonLd: [],
      metaTags: {},
    };
    const r = await SYNTHESIZERS.S_tldr_missing!(state, baseInstr("S_tldr_missing"), ctx());
    expect(r.outcome).toBe("applied");
    // Handshake contract §7a — canonical TL;DR markup is <p data-tldr>.
    expect(r.html).toMatch(/<\/h1>\s*<p data-tldr/);
    expect(r.html).toContain("Answer engine optimization");
  });

  it("skips when TL;DR already present", async () => {
    const state: HandlerState = {
      html: `<article><h1>x</h1><aside class="tldr">Already here.</aside></article>`,
      jsonLd: [],
      metaTags: {},
    };
    const r = await SYNTHESIZERS.S_tldr_missing!(state, baseInstr("S_tldr_missing"), ctx());
    expect(r.outcome).toBe("skipped");
    expect(r.reason).toMatch(/already present/);
  });

  it("uses injected LLM when runLlm=true", async () => {
    const state: HandlerState = {
      html: `<article><h1>AEO</h1><p>intro</p></article>`,
      jsonLd: [],
      metaTags: {},
    };
    const r = await SYNTHESIZERS.S_tldr_missing!(
      state,
      baseInstr("S_tldr_missing"),
      ctx({
        runLlm: true,
        callClaude: async () =>
          "AEO means shaping content so AI quotes you directly. Win it by writing for the reader the AI has become.",
      }),
    );
    expect(r.outcome).toBe("applied");
    expect(r.html).toContain("Win it by writing");
  });
});

describe("DefinedTerm synthesizer", () => {
  it("appends a DefinedTerm entity built from the primary keyword + definition", async () => {
    const state: HandlerState = {
      html: `<article><h1>X</h1><p>Answer engine optimization is the practice of shaping content for AI answers.</p></article>`,
      jsonLd: { "@context": "https://schema.org", "@graph": [{ "@type": "BlogPosting" }] },
      metaTags: {},
    };
    const r = await SYNTHESIZERS.S_missing_DefinedTerm_schema!(
      state,
      baseInstr("S_missing_DefinedTerm_schema"),
      ctx(),
    );
    expect(r.outcome).toBe("applied");
    const graph = (r.jsonLd as { "@graph": unknown[] })["@graph"];
    const dt = graph.find((n) => (n as Record<string, unknown>)["@type"] === "DefinedTerm") as Record<string, unknown>;
    expect(dt).toBeTruthy();
    expect(dt.name).toBe("answer engine optimization");
    expect(String(dt.description)).toMatch(/shaping content/);
  });

  it("skips when DefinedTerm already present", async () => {
    const state: HandlerState = {
      html: "",
      jsonLd: [{ "@type": "DefinedTerm", name: "AEO" }],
      metaTags: {},
    };
    const r = await SYNTHESIZERS.S_missing_DefinedTerm_schema!(
      state,
      baseInstr("S_missing_DefinedTerm_schema"),
      ctx(),
    );
    expect(r.outcome).toBe("skipped");
  });

  it("skips when no definitional sentence found", async () => {
    const state: HandlerState = {
      html: `<article><p>Completely unrelated text about cats and dogs.</p></article>`,
      jsonLd: [],
      metaTags: {},
    };
    const r = await SYNTHESIZERS.S_missing_DefinedTerm_schema!(
      state,
      baseInstr("S_missing_DefinedTerm_schema"),
      ctx({
        source: {
          article: {
            intro: [{ text: "Completely unrelated text about cats and dogs." }],
          },
        } as unknown as SynthesisContext["source"],
      }),
    );
    expect(r.outcome).toBe("skipped");
  });
});

describe("FAQ count rectifier", () => {
  it("rebuilds FAQPage entity from visible <details> blocks", async () => {
    const state: HandlerState = {
      html: `<article>
        <details><summary>What is AEO?</summary><p>The practice of optimizing for AI answers.</p></details>
        <details><summary>How is AEO different from SEO?</summary><p>AEO focuses on answer engines, SEO on search.</p></details>
      </article>`,
      jsonLd: { "@context": "https://schema.org", "@graph": [{ "@type": "FAQPage", mainEntity: [] }] },
      metaTags: {},
    };
    const r = await SYNTHESIZERS.P_faq_count_mismatch!(state, baseInstr("P_faq_count_mismatch"), ctx());
    expect(r.outcome).toBe("applied");
    const graph = (r.jsonLd as { "@graph": unknown[] })["@graph"];
    const faq = graph.find((n) => (n as Record<string, unknown>)["@type"] === "FAQPage") as Record<string, unknown>;
    const mainEntity = faq.mainEntity as unknown[];
    expect(mainEntity).toHaveLength(2);
    expect((mainEntity[0] as Record<string, unknown>).name).toBe("What is AEO?");
  });

  it("rebuilds from h2 + paragraph pattern in a faq section", async () => {
    const state: HandlerState = {
      html: `<article><section id="faq">
        <h2>What is AEO?</h2><p>The practice.</p>
        <h2>Who needs it?</h2><p>Brands targeting AI visibility.</p>
        <h2>Conclusion</h2><p>End.</p>
      </section></article>`,
      jsonLd: [],
      metaTags: {},
    };
    const r = await SYNTHESIZERS.P_faq_count_mismatch!(state, baseInstr("P_faq_count_mismatch"), ctx());
    expect(r.outcome).toBe("applied");
    const graph = (r.jsonLd as { "@graph": unknown[] })["@graph"] ?? r.jsonLd;
    const list = Array.isArray(graph) ? graph : [];
    const faq = list.find((n) => (n as Record<string, unknown>)["@type"] === "FAQPage") as Record<string, unknown>;
    expect(faq).toBeTruthy();
    // "Conclusion" has no ? so it's filtered out.
    expect((faq.mainEntity as unknown[]).length).toBe(2);
  });

  it("skips when no visible FAQ blocks exist", async () => {
    const state: HandlerState = { html: `<article><p>no faq here</p></article>`, jsonLd: [], metaTags: {} };
    const r = await SYNTHESIZERS.P_faq_count_mismatch!(state, baseInstr("P_faq_count_mismatch"), ctx());
    expect(r.outcome).toBe("skipped");
  });
});

describe("Word-count band handler", () => {
  it("reclassifies to pillar when not already pillar", async () => {
    const longBody = "word ".repeat(3000);
    const state: HandlerState = {
      html: `<html><head></head><body><article>${longBody}</article></body></html>`,
      jsonLd: [],
      metaTags: {},
    };
    const r = await SYNTHESIZERS.S_word_count_above_band!(
      state,
      baseInstr("S_word_count_above_band"),
      ctx(),
    );
    expect(r.outcome).toBe("applied");
    expect((r.metaTags as Record<string, string>)["x-post-type"]).toBe("pillar");
    expect(r.html).toContain(`data-post-type="pillar"`);
  });

  it("escalates when already pillar", async () => {
    const state: HandlerState = {
      html: `<html><body><article>body</article></body></html>`,
      jsonLd: [],
      metaTags: {},
    };
    const r = await SYNTHESIZERS.S_word_count_above_band!(
      state,
      baseInstr("S_word_count_above_band"),
      ctx({
        source: {
          article: { format: "pillar", intro: [] },
        } as unknown as SynthesisContext["source"],
      }),
    );
    expect(r.outcome).toBe("escalated");
  });
});

describe("Dispatcher integration", () => {
  it("routes content-level findings with empty patch through synthesizers", async () => {
    const { applyInstructions } = await import("../../src/blog/apply-instructions.js");
    const state: HandlerState = {
      html: `<article><h1>AEO</h1><p>Answer engine optimization is the practice of shaping content so AI systems quote it directly.</p></article>`,
      jsonLd: [],
      metaTags: {},
    };
    const result = await applyInstructions({
      state,
      fixOrder: ["S_tldr_missing", "S_missing_DefinedTerm_schema"],
      instructions: [
        baseInstr("S_tldr_missing", "attempt_rewrite"),
        baseInstr("S_missing_DefinedTerm_schema", "insert_missing"),
      ],
      synthesis: ctx(),
    });
    expect(result.counts.applied).toBe(2);
    expect(result.state.html).toMatch(/<p data-tldr/);
    expect(result.state.html).toContain("DefinedTerm");
  });

  it("leaves synthesizers alone when synthesis context is absent", async () => {
    const { applyInstructions } = await import("../../src/blog/apply-instructions.js");
    const state: HandlerState = { html: `<article><h1>x</h1></article>`, jsonLd: [], metaTags: {} };
    const result = await applyInstructions({
      state,
      fixOrder: ["S_tldr_missing"],
      instructions: [baseInstr("S_tldr_missing", "attempt_rewrite")],
    });
    // Without synthesis context, attempt_rewrite falls through and skips (no patch)
    expect(result.counts.applied ?? 0).toBe(0);
  });
});

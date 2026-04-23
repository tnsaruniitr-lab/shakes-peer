import { describe, it, expect } from "vitest";
import { insertMissingHandler } from "../../src/handlers/insert-missing.js";
import type { HandlerState, Instruction } from "../../src/handlers/types.js";

function make(patch: Instruction["patch"]): Instruction {
  return { check_id: "D5", severity: "fail", layer: "technical", evidence: "", action: "insert_missing", patch };
}

describe("insertMissingHandler — schema", () => {
  it("appends a new FAQPage entity to @graph", () => {
    const jsonLd = { "@context": "https://schema.org", "@graph": [{ "@type": "BlogPosting" }] };
    const html = `<html><head><script type="application/ld+json">${JSON.stringify(
      jsonLd,
    )}</script></head><body></body></html>`;
    const state: HandlerState = { html, jsonLd, metaTags: {} };

    const faq = { "@type": "FAQPage", mainEntity: [] };
    const r = insertMissingHandler(
      state,
      make({ type: "insert_schema", target: "jsonld:FAQPage", before: "", after: JSON.stringify(faq), rationale: "" }),
    );
    expect(r.outcome).toBe("applied");
    const graph = (r.jsonLd as { "@graph": unknown[] })["@graph"];
    expect(graph.length).toBe(2);
    expect(r.html).toContain(`"FAQPage"`);
  });

  it("replaces existing entity of same @type", () => {
    const existingFaq = { "@type": "FAQPage", mainEntity: [{ "@type": "Question" }] };
    const jsonLd = { "@context": "https://schema.org", "@graph": [existingFaq] };
    const html = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
    const state: HandlerState = { html, jsonLd, metaTags: {} };

    const newFaq = { "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "New" }] };
    const r = insertMissingHandler(
      state,
      make({ type: "insert_schema", target: "jsonld:FAQPage", before: "", after: JSON.stringify(newFaq), rationale: "" }),
    );
    expect(r.outcome).toBe("applied");
    const graph = (r.jsonLd as { "@graph": unknown[] })["@graph"];
    expect(graph.length).toBe(1);
    expect(JSON.stringify(graph[0])).toContain(`"New"`);
  });

  it("skips invalid JSON", () => {
    const state: HandlerState = { html: "", jsonLd: [], metaTags: {} };
    const r = insertMissingHandler(
      state,
      make({ type: "insert_schema", target: "jsonld:FAQPage", before: "", after: "{not json", rationale: "" }),
    );
    expect(r.outcome).toBe("skipped");
  });
});

describe("insertMissingHandler — html", () => {
  it("inserts after matching tag", () => {
    const state: HandlerState = {
      html: `<article><h1>Title</h1><p>body</p></article>`,
      jsonLd: [],
      metaTags: {},
    };
    const r = insertMissingHandler(
      state,
      make({
        type: "insert_html",
        target: "after:h1",
        before: "",
        after: `<aside class="editorial-stance">Our take…</aside>`,
        rationale: "",
      }),
    );
    expect(r.outcome).toBe("applied");
    expect(r.html).toMatch(/<\/h1>\s*<aside/);
  });

  it("falls back to appending inside <article>", () => {
    const state: HandlerState = { html: `<article><h1>T</h1></article>`, jsonLd: [], metaTags: {} };
    const r = insertMissingHandler(
      state,
      make({ type: "insert_html", target: "after:nonexistent", before: "", after: `<p>foot</p>`, rationale: "" }),
    );
    expect(r.outcome).toBe("applied");
    expect(r.html).toMatch(/<p>foot<\/p>\s*<\/article>/);
  });
});

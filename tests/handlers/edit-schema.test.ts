import { describe, it, expect } from "vitest";
import { editSchemaHandler } from "../../src/handlers/edit-schema.js";
import type { HandlerState, Instruction } from "../../src/handlers/types.js";

function make(patch: Instruction["patch"]): Instruction {
  return { check_id: "D1", severity: "fail", layer: "technical", evidence: "", action: "edit_schema", patch };
}

describe("editSchemaHandler — meta tags", () => {
  it("updates an existing meta property tag", () => {
    const html = `<html><head><meta property="og:title" content="old"></head><body></body></html>`;
    const state: HandlerState = { html, jsonLd: [], metaTags: { "og:title": "old" } };
    const r = editSchemaHandler(
      state,
      make({ type: "meta_tag_edit", target: "og:title", before: "old", after: "new", rationale: "" }),
    );
    expect(r.outcome).toBe("applied");
    expect(r.html).toContain(`content="new"`);
    expect((r.metaTags as Record<string, string>)["og:title"]).toBe("new");
  });

  it("rejects drift when meta content changed since audit", () => {
    const state: HandlerState = {
      html: `<meta property="og:title" content="current">`,
      jsonLd: [],
      metaTags: { "og:title": "current" },
    };
    const r = editSchemaHandler(
      state,
      make({ type: "meta_tag_edit", target: "og:title", before: "stale", after: "new", rationale: "" }),
    );
    expect(r.outcome).toBe("drift");
  });

  it("injects meta tag into <head> when missing", () => {
    const state: HandlerState = { html: `<html><head></head><body></body></html>`, jsonLd: [], metaTags: {} };
    const r = editSchemaHandler(
      state,
      make({ type: "meta_tag_edit", target: "og:description", before: "", after: "hello", rationale: "" }),
    );
    expect(r.outcome).toBe("applied");
    expect(r.html).toContain(`property="og:description"`);
    expect(r.html).toContain(`content="hello"`);
  });
});

describe("editSchemaHandler — JSON-LD field edits", () => {
  it("updates nested BlogPosting.author.name", () => {
    const jsonLd = [{ "@type": "BlogPosting", author: { "@type": "Person", name: "Old Name" } }];
    const html = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
    const state: HandlerState = { html, jsonLd, metaTags: {} };
    const r = editSchemaHandler(
      state,
      make({
        type: "schema_field_edit",
        target: "BlogPosting.author.name",
        before: "Old Name",
        after: "New Name",
        rationale: "",
      }),
    );
    expect(r.outcome).toBe("applied");
    const serialized = JSON.stringify(r.jsonLd);
    expect(serialized).toContain(`"name":"New Name"`);
    expect(r.html).toContain(`New Name`);
  });

  it("reports drift when current value differs from before", () => {
    const jsonLd = [{ "@type": "BlogPosting", headline: "Actual" }];
    const state: HandlerState = {
      html: `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
      jsonLd,
      metaTags: {},
    };
    const r = editSchemaHandler(
      state,
      make({ type: "schema_field_edit", target: "BlogPosting.headline", before: "Stale", after: "X", rationale: "" }),
    );
    expect(r.outcome).toBe("drift");
  });
});

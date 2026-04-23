import { describe, it, expect } from "vitest";
import { attemptRewriteHandler } from "../../src/handlers/attempt-rewrite.js";
import type { HandlerState, Instruction } from "../../src/handlers/types.js";

function make(patch: Instruction["patch"], evidence = "weak para"): Instruction {
  return {
    check_id: "H1",
    severity: "fail",
    layer: "humanization",
    evidence,
    action: "attempt_rewrite",
    patch,
  };
}

const state: HandlerState = {
  html: `<p>This is a somewhat robust solution that leverages best practices.</p>`,
  jsonLd: [],
  metaTags: {},
};

describe("attemptRewriteHandler", () => {
  it("skips when llm disabled", async () => {
    const r = await attemptRewriteHandler(
      state,
      make({
        type: "rewrite_paragraph",
        target: "p",
        before: "<p>This is a somewhat robust solution that leverages best practices.</p>",
        after: "",
        rationale: "",
      }),
      { runLlm: false },
    );
    expect(r.outcome).toBe("skipped");
    expect(r.reason).toContain("llm rewrites disabled");
  });

  it("replaces via injected llm callback", async () => {
    const r = await attemptRewriteHandler(
      state,
      make({
        type: "rewrite_paragraph",
        target: "p",
        before: "<p>This is a somewhat robust solution that leverages best practices.</p>",
        after: "",
        rationale: "",
      }),
      {
        runLlm: true,
        // Rewrite stays within the semantic material of the before-text
        // (a solution, best practices) — doesn't invent numbers, names,
        // first-person claims, or clinical credentials. This is what the
        // fabrication guardrail is enforcing.
        callClaude: async () =>
          "<p>This approach relies on standard conventions rather than bespoke tooling.</p>",
      },
    );
    expect(r.outcome).toBe("applied");
    expect(r.html).toContain("standard conventions");
    expect(r.html).not.toContain("robust");
  });

  it("rejects rewrites with banned AI markers", async () => {
    const r = await attemptRewriteHandler(
      state,
      make({
        type: "rewrite_paragraph",
        target: "p",
        before: "<p>This is a somewhat robust solution that leverages best practices.</p>",
        after: "",
        rationale: "",
      }),
      {
        runLlm: true,
        callClaude: async () =>
          "<p>As an AI language model, I cannot help with that but here is a rewrite.</p>",
      },
    );
    expect(r.outcome).toBe("skipped");
    expect(r.reason).toMatch(/banned marker/);
  });

  it("reports drift when before is not in html", async () => {
    const r = await attemptRewriteHandler(
      state,
      make({ type: "rewrite_paragraph", target: "p", before: "<p>NOT PRESENT</p>", after: "", rationale: "" }),
      { runLlm: true, callClaude: async () => "x" },
    );
    expect(r.outcome).toBe("drift");
  });
});

import { describe, it, expect } from "vitest";
import { applyPatchHandler } from "../../src/handlers/apply-patch.js";
import type { HandlerState, Instruction } from "../../src/handlers/types.js";

const baseState: HandlerState = { html: "", jsonLd: [], metaTags: {} };

function instr(patch: Instruction["patch"]): Instruction {
  return {
    check_id: "T1",
    severity: "fail",
    layer: "technical",
    evidence: "x",
    action: "apply_patch",
    patch,
  };
}

describe("applyPatchHandler", () => {
  it("replaces a unique occurrence", () => {
    const state = { ...baseState, html: "<p>hello world</p>" };
    const r = applyPatchHandler(
      state,
      instr({ type: "replace_span", target: "p", before: "hello world", after: "hi there", rationale: "" }),
    );
    expect(r.outcome).toBe("applied");
    expect(r.html).toBe("<p>hi there</p>");
  });

  it("reports drift when before is missing", () => {
    const r = applyPatchHandler(
      { ...baseState, html: "<p>a</p>" },
      instr({ type: "replace_span", target: "p", before: "NOT THERE", after: "x", rationale: "" }),
    );
    expect(r.outcome).toBe("drift");
  });

  it("refuses ambiguous multi-match", () => {
    const r = applyPatchHandler(
      { ...baseState, html: "<p>x</p><p>x</p>" },
      instr({ type: "replace_span", target: "p", before: "<p>x</p>", after: "<p>y</p>", rationale: "" }),
    );
    expect(r.outcome).toBe("ambiguous");
  });

  it("skips no-op (before === after)", () => {
    const r = applyPatchHandler(
      { ...baseState, html: "<p>x</p>" },
      instr({ type: "replace_span", target: "p", before: "x", after: "x", rationale: "" }),
    );
    expect(r.outcome).toBe("skipped");
  });

  it("skips when patch is absent", () => {
    const r = applyPatchHandler(baseState, { ...instr(undefined), patch: undefined });
    expect(r.outcome).toBe("skipped");
  });
});

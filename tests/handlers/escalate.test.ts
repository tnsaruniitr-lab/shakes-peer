import { describe, it, expect } from "vitest";
import { createEscalationSink, escalateHandler } from "../../src/handlers/escalate.js";
import type { HandlerState, Instruction } from "../../src/handlers/types.js";

describe("escalateHandler", () => {
  it("pushes an escalation and returns state untouched", () => {
    const state: HandlerState = { html: "<p>x</p>", jsonLd: [], metaTags: {} };
    const sink = createEscalationSink();
    const instr: Instruction = {
      check_id: "F2",
      severity: "critical",
      layer: "eeat",
      evidence: "No author entity",
      action: "human_fix_required",
    };
    const r = escalateHandler(state, instr, sink);
    expect(r.outcome).toBe("escalated");
    expect(r.html).toBe("<p>x</p>");
    expect(sink.records).toHaveLength(1);
    expect(sink.records[0]!.checkId).toBe("F2");
    expect(sink.records[0]!.severity).toBe("critical");
  });
});

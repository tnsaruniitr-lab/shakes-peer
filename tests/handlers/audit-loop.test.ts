import { describe, it, expect } from "vitest";
import { runAuditLoop, type AuditRunPayload } from "../../src/blog/audit-loop.js";
import type { HandlerState } from "../../src/handlers/types.js";

const initial: HandlerState = { html: "<article><p>hello</p></article>", jsonLd: [], metaTags: {} };

function ship(score = 95): AuditRunPayload {
  return {
    meta: { final_score: score, critical_count: 0, verdict: "ship", is_final: false, target_score: 90, version: 1 },
    fix_order: [],
    instructions: [],
    regressions: [],
  };
}

describe("runAuditLoop", () => {
  it("terminates with ship when score meets target and no criticals", async () => {
    const r = await runAuditLoop({ initialState: initial, runAudit: async () => ship(95) });
    expect(r.terminal).toBe("ship");
  });

  it("applies a patch and re-audits to ship", async () => {
    let round = 0;
    const r = await runAuditLoop({
      initialState: initial,
      runAudit: async () => {
        round++;
        if (round === 1) {
          return {
            meta: { final_score: 70, critical_count: 0, verdict: "edit", is_final: false, target_score: 90, version: 1 },
            fix_order: ["A1"],
            instructions: [
              {
                check_id: "A1",
                severity: "fail",
                layer: "technical",
                evidence: "",
                action: "apply_patch",
                patch: { type: "replace_span", target: "p", before: "hello", after: "howdy", rationale: "" },
              },
            ],
            regressions: [],
          };
        }
        return ship(92);
      },
    });
    expect(r.terminal).toBe("ship");
    expect(r.finalState.html).toContain("howdy");
    expect(r.rounds).toHaveLength(2);
  });

  it("detects regression spike and halts", async () => {
    const r = await runAuditLoop({
      initialState: initial,
      runAudit: async () => ({
        meta: { final_score: 60, critical_count: 1, verdict: "block", is_final: false, target_score: 90, version: 2 },
        fix_order: [],
        instructions: [],
        regressions: [{ checkId: "D1", status: "regressed", severity: "critical" }],
      }),
    });
    expect(r.terminal).toBe("regression_spike");
  });

  it("returns isFinal when blog-buster signals it", async () => {
    const r = await runAuditLoop({
      initialState: initial,
      runAudit: async () => ({
        meta: { final_score: 80, critical_count: 0, verdict: "edit", is_final: true, target_score: 90, version: 5 },
        fix_order: [],
        instructions: [],
        regressions: [],
      }),
    });
    expect(r.terminal).toBe("isFinal");
  });

  it("terminates as needs_review when criticals escalate but aren't auto-fixable", async () => {
    const r = await runAuditLoop({
      initialState: initial,
      maxRounds: 2,
      runAudit: async () => ({
        meta: { final_score: 50, critical_count: 1, verdict: "block", is_final: false, target_score: 90, version: 1 },
        fix_order: ["F2"],
        instructions: [
          { check_id: "F2", severity: "critical", layer: "eeat", evidence: "missing author", action: "human_fix_required" },
        ],
        regressions: [],
      }),
    });
    // Escalated-only findings = 0 applied → non-blocking terminal needs_review.
    expect(r.terminal).toBe("needs_review");
    expect(r.totalEscalations.length).toBeGreaterThan(0);
  });
});

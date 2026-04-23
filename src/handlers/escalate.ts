import type { HandlerResult, HandlerState, Instruction } from "./types.js";

// ─────────────────────────────────────────────────────────────────────────────
// human_fix_required handler
//
// Terminal for a single instruction: we log it to the escalation list and
// return `escalated`. The dispatcher collects all escalations; the outer
// loop decides whether to `block` the publish (severity=critical) or proceed
// with a warning (severity=fail/warn/info).
// ─────────────────────────────────────────────────────────────────────────────

export interface EscalationRecord {
  checkId: string;
  severity: Instruction["severity"];
  evidence: string;
  hint?: string;
  at: string; // ISO timestamp
}

export function createEscalationSink() {
  const records: EscalationRecord[] = [];
  return {
    records,
    push(r: EscalationRecord) {
      records.push(r);
    },
  };
}

export function escalateHandler(
  state: HandlerState,
  instruction: Instruction,
  sink?: { push: (r: EscalationRecord) => void },
): HandlerResult {
  sink?.push({
    checkId: instruction.check_id,
    severity: instruction.severity,
    evidence: instruction.evidence,
    hint: instruction.patch?.rationale,
    at: new Date().toISOString(),
  });
  return {
    ...state,
    checkId: instruction.check_id,
    action: instruction.action,
    outcome: "escalated",
    reason: `human_fix_required (${instruction.severity})`,
  };
}

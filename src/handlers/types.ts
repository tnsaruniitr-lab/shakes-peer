// Common types shared across all instruction handlers.
//
// These mirror blog-buster's ShakespeerInstruction shape (see
// blog-buster/dist/output/shakespeer-instructions.d.ts) without importing from
// blog-buster directly, so handler unit tests don't need the blog-buster build.

export type InstructionAction =
  | "apply_patch"
  | "edit_schema"
  | "insert_missing"
  | "attempt_rewrite"
  | "human_fix_required";

export type Severity = "critical" | "fail" | "warn" | "info";

export interface PatchEnvelope {
  type: string;
  target: string;
  before: string;
  after: string;
  rationale: string;
}

export interface Instruction {
  check_id: string;
  severity: Severity;
  layer: string;
  evidence: string;
  action: InstructionAction;
  patch?: PatchEnvelope;
}

export type HandlerOutcome =
  | "applied"
  | "skipped"
  | "drift"
  | "ambiguous"
  | "escalated"
  | "failed";

export type OutcomeCounts = Partial<Record<HandlerOutcome, number>>;

export interface HandlerState {
  html: string;
  jsonLd: Record<string, unknown> | unknown[];
  metaTags: Record<string, string>;
}

export interface HandlerResult extends HandlerState {
  outcome: HandlerOutcome;
  reason?: string;
  checkId: string;
  action: InstructionAction;
}

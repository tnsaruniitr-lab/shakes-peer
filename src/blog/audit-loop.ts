import { applyInstructions, type ApplyInstructionsResult } from "./apply-instructions.js";
import type { HandlerState, Instruction } from "../handlers/types.js";
import type { RewriteDeps } from "../handlers/attempt-rewrite.js";
import type { EscalationRecord } from "../handlers/escalate.js";
import type { SynthesisContext } from "../handlers/synthesize-content.js";

// ─────────────────────────────────────────────────────────────────────────────
// Outer audit loop (shakes-peer side of the handshake).
//
// Per contract §2:
//   - Up to MAX_ROUNDS outer rounds.
//   - Each round: audit() → applyInstructions() → re-audit() on next round.
//   - Terminal states:
//       ship              final_score >= target AND critical_count == 0
//       block             critical_count > 0 AND round hit floor
//       isFinal           blog-buster signalled is_final (no more patches)
//       regression_spike  previously-fixed check re-fired as critical
//
// The loop is parameterized over `runAudit` so the caller (routes/blog.ts or
// the smoke script) can inject either blog-buster's `audit()` directly or a
// mock for unit tests.
// ─────────────────────────────────────────────────────────────────────────────

export type TerminalState =
  | "ship"
  | "block"
  | "isFinal"
  | "regression_spike"
  | "exhausted"
  | "needs_review"; // auto-fixes done; open items remain for editors

export interface AuditRunMeta {
  final_score: number;
  critical_count: number;
  verdict: "ship" | "edit" | "block";
  is_final: boolean;
  is_final_pending?: boolean;
  target_score: number;
  version: number;
}

export interface AuditRunPayload {
  meta: AuditRunMeta;
  fix_order: string[];
  instructions: Instruction[];
  regressions: Array<{ checkId: string; status: string; severity: Instruction["severity"] }>;
}

export interface AuditLoopInput {
  initialState: HandlerState;
  runAudit: (state: HandlerState, round: number) => Promise<AuditRunPayload>;
  maxRounds?: number;
  rewrite?: RewriteDeps;
  synthesis?: SynthesisContext;
}

export interface AuditLoopRound {
  round: number;
  audit: AuditRunMeta;
  dispatch: ApplyInstructionsResult;
}

export interface AuditLoopResult {
  terminal: TerminalState;
  reason: string;
  finalState: HandlerState;
  rounds: AuditLoopRound[];
  totalEscalations: EscalationRecord[];
}

export async function runAuditLoop(input: AuditLoopInput): Promise<AuditLoopResult> {
  // Handshake coherence brief §B3 — LLM-judge findings (H_judge_*, Q_*) climb
  // ~2 points per rewrite pass; they need 5 rounds to cross the 7/10 threshold.
  // Deterministic runs have no judge to benefit, so cap at 3.
  const llmEnabled = input.rewrite?.runLlm === true || input.synthesis?.runLlm === true;
  const maxRounds = input.maxRounds ?? (llmEnabled ? 5 : 3);
  const rounds: AuditLoopRound[] = [];
  const totalEscalations: EscalationRecord[] = [];
  let state = input.initialState;

  for (let round = 1; round <= maxRounds; round++) {
    const payload = await input.runAudit(state, round);

    // Regression spike: any previously-fixed check re-fired at critical.
    const regressionSpike = payload.regressions.find(
      (r) => r.status === "regressed" && r.severity === "critical",
    );
    if (regressionSpike) {
      rounds.push({
        round,
        audit: payload.meta,
        dispatch: emptyDispatch(state),
      });
      return {
        terminal: "regression_spike",
        reason: `critical regression on ${regressionSpike.checkId}`,
        finalState: state,
        rounds,
        totalEscalations,
      };
    }

    // Ship: goal met, nothing more to do.
    if (
      payload.meta.verdict === "ship" &&
      payload.meta.critical_count === 0 &&
      payload.meta.final_score >= payload.meta.target_score
    ) {
      rounds.push({ round, audit: payload.meta, dispatch: emptyDispatch(state) });
      return {
        terminal: "ship",
        reason: `score ${payload.meta.final_score}/${payload.meta.target_score}, 0 critical`,
        finalState: state,
        rounds,
        totalEscalations,
      };
    }

    // isFinal: blog-buster gave up producing patches.
    if (payload.meta.is_final && payload.instructions.length === 0) {
      rounds.push({ round, audit: payload.meta, dispatch: emptyDispatch(state) });
      return {
        terminal: "isFinal",
        reason: `blog-buster marked is_final at score ${payload.meta.final_score}`,
        finalState: state,
        rounds,
        totalEscalations,
      };
    }

    // Dispatch instructions.
    const dispatch = await applyInstructions({
      state,
      fixOrder: payload.fix_order,
      instructions: payload.instructions,
      rewrite: input.rewrite,
      synthesis: input.synthesis,
    });
    rounds.push({ round, audit: payload.meta, dispatch });
    totalEscalations.push(...dispatch.escalations);
    state = dispatch.state;

    // Policy: critical `human_fix_required` findings stay OPEN but don't
    // block the loop. They're called out in history.json + the README so
    // editors can resolve them post-hoc. The loop keeps running so every
    // auto-fixable finding still lands.
    //
    // The only early-exit on no-progress is when NOTHING applied this round
    // — then future rounds would just re-audit the same state. We mark the
    // terminal `needs_review` if escalations exist (rather than block) so the
    // downstream consumer knows the blog is usable but has open items.
    if ((dispatch.counts.applied ?? 0) === 0) {
      const hasOpenEscalations = totalEscalations.length > 0;
      return {
        terminal: hasOpenEscalations ? "needs_review" : "exhausted",
        reason: hasOpenEscalations
          ? `no further auto-fixes; ${totalEscalations.length} open item(s) for editorial review`
          : "no applicable fixes this round",
        finalState: state,
        rounds,
        totalEscalations,
      };
    }
  }

  const hasOpen = totalEscalations.length > 0;
  return {
    terminal: hasOpen ? "needs_review" : "exhausted",
    reason: hasOpen
      ? `reached maxRounds=${maxRounds} with ${totalEscalations.length} open item(s) for editorial review`
      : `reached maxRounds=${maxRounds}`,
    finalState: state,
    rounds,
    totalEscalations,
  };
}

function emptyDispatch(state: HandlerState): ApplyInstructionsResult {
  return {
    state,
    trace: [],
    escalations: [],
    counts: {},
    criticalUnresolved: false,
  };
}

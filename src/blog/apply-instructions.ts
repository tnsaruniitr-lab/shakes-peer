import { applyPatchHandler } from "../handlers/apply-patch.js";
import { editSchemaHandler } from "../handlers/edit-schema.js";
import { insertMissingHandler } from "../handlers/insert-missing.js";
import { attemptRewriteHandler, type RewriteDeps } from "../handlers/attempt-rewrite.js";
import { createEscalationSink, escalateHandler, type EscalationRecord } from "../handlers/escalate.js";
import {
  SYNTHESIZERS,
  hasSynthesizer,
  type SynthesisContext,
} from "../handlers/synthesize-content.js";
import type { HandlerResult, HandlerState, Instruction, OutcomeCounts } from "../handlers/types.js";

// ─────────────────────────────────────────────────────────────────────────────
// apply-instructions dispatcher
//
// Takes the blog-buster ShakespeerInstructionsPayload (fix_order + instructions)
// and walks each instruction in `fix_order`, routing to the matching handler
// and threading the mutated HandlerState through the chain.
//
// Each handler is pure-ish: reads state, returns next state + outcome. The
// dispatcher only sequences them and collects a per-instruction trace.
//
// Outer-loop contract (consumed by audit-loop.ts):
//   - If any critical instruction is `escalated` or `drift` or `failed`,
//     the outer loop should mark the round as blocked and stop.
//   - If every instruction in `fix_order` is `applied` or soft-`skipped`,
//     the outer loop re-audits with the new state.
// ─────────────────────────────────────────────────────────────────────────────

export interface ApplyInstructionsInput {
  state: HandlerState;
  fixOrder: string[];
  instructions: Instruction[];
  rewrite?: RewriteDeps; // defaults to { runLlm: false } — tests stay offline
  synthesis?: SynthesisContext; // if omitted, content synthesizers are skipped
}

export interface ApplyInstructionsResult {
  state: HandlerState;
  trace: HandlerResult[];
  escalations: EscalationRecord[];
  counts: OutcomeCounts;
  criticalUnresolved: boolean; // any critical instruction not `applied`
}

export async function applyInstructions(
  input: ApplyInstructionsInput,
): Promise<ApplyInstructionsResult> {
  const { fixOrder, instructions } = input;
  const byId = new Map(instructions.map((i) => [i.check_id, i]));
  const sink = createEscalationSink();
  const trace: HandlerResult[] = [];
  let state = input.state;

  const rewriteDeps: RewriteDeps = input.rewrite ?? { runLlm: false };

  // Fall back to instructions order if fix_order is missing/empty.
  const order = fixOrder.length > 0 ? fixOrder : instructions.map((i) => i.check_id);

  for (const checkId of order) {
    const instr = byId.get(checkId);
    if (!instr) continue;
    let result: HandlerResult;

    // Content synthesizer short-circuit: if a check_id has a synthesizer and
    // blog-buster didn't send a usable patch envelope, run the synthesizer
    // instead of the default handler. This covers the 4 findings blog-buster
    // can't auto-fix (TL;DR, DefinedTerm, FAQ count, word-count band).
    const envelopeEmpty =
      !instr.patch || (!instr.patch.after?.trim() && !instr.patch.before?.trim());
    if (input.synthesis && hasSynthesizer(checkId) && envelopeEmpty) {
      const synth = SYNTHESIZERS[checkId]!;
      result = await synth(state, instr, input.synthesis);
      trace.push(result);
      state = { html: result.html, jsonLd: result.jsonLd, metaTags: result.metaTags };
      continue;
    }

    switch (instr.action) {
      case "apply_patch":
        result = applyPatchHandler(state, instr);
        break;
      case "edit_schema":
        result = editSchemaHandler(state, instr);
        break;
      case "insert_missing":
        result = insertMissingHandler(state, instr);
        break;
      case "attempt_rewrite":
        result = await attemptRewriteHandler(state, instr, rewriteDeps);
        break;
      case "human_fix_required":
        result = escalateHandler(state, instr, sink);
        break;
      default:
        result = {
          ...state,
          checkId: instr.check_id,
          action: instr.action,
          outcome: "skipped",
          reason: `unknown action: ${instr.action}`,
        };
    }
    trace.push(result);
    state = { html: result.html, jsonLd: result.jsonLd, metaTags: result.metaTags };
  }

  const counts: OutcomeCounts = {};
  for (const r of trace) counts[r.outcome] = (counts[r.outcome] ?? 0) + 1;

  const criticalUnresolved = trace.some((r) => {
    const instr = byId.get(r.checkId);
    return instr?.severity === "critical" && r.outcome !== "applied";
  });

  return { state, trace, escalations: sink.records, counts, criticalUnresolved };
}

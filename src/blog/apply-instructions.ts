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

  // Reorder so synthesizers + content-inserts run AFTER blog-buster's span
  // patches. Synthesizers mutate large chunks (TL;DR injection after <h1>,
  // author-bio block, last-updated stamp) — running them first invalidates
  // any subsequent apply_patch targeting those regions. Spans first, inserts
  // last is the safer order.
  const baseOrder = fixOrder.length > 0 ? fixOrder : instructions.map((i) => i.check_id);
  const deferredChecks = new Set<string>();
  for (const id of baseOrder) {
    const instr = byId.get(id);
    if (!instr) continue;
    if (instr.action === "insert_missing") {
      deferredChecks.add(id);
      continue;
    }
    const envelopeEmptyForSynth =
      !instr.patch || (!instr.patch.after?.trim() && !instr.patch.before?.trim());
    if (input.synthesis && hasSynthesizer(id) && envelopeEmptyForSynth) {
      deferredChecks.add(id);
    }
  }
  const order = [
    ...baseOrder.filter((id) => !deferredChecks.has(id)),
    ...baseOrder.filter((id) => deferredChecks.has(id)),
  ];

  // Collected drift/ambiguous results are retried after the main pass with
  // fuzzy whitespace matching — resolves the "first patch applied mutates
  // the HTML so later patches targeting nearby spans no longer match" trap.
  const deferRetry: Instruction[] = [];

  for (const checkId of order) {
    const instr = byId.get(checkId);
    if (!instr) continue;
    let result: HandlerResult;

    // Content synthesizer short-circuit: if a check_id has a synthesizer and
    // blog-buster didn't send a usable patch envelope, run the synthesizer
    // instead of the default handler.
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

    // Collect drifted patches for a second fuzzy-match pass.
    if (result.outcome === "drift" && instr.patch?.before && instr.patch.after) {
      deferRetry.push(instr);
    }
  }

  // Drift retry pass — fuzzy whitespace match. Blog-buster's patches are
  // sometimes snapshot-dependent (generated against pre-dispatch HTML); by
  // the time we get here, our synthesizers or other patches have shifted
  // positions. A second pass with normalized-whitespace matching recovers
  // most of them without risking false replacements.
  for (const instr of deferRetry) {
    const fuzzy = applyFuzzyPatch(state.html, instr.patch!.before, instr.patch!.after);
    if (fuzzy) {
      state = { ...state, html: fuzzy };
      // Replace the trace entry for this checkId with a "recovered" result.
      const prevIdx = trace.findIndex(
        (t) => t.checkId === instr.check_id && t.outcome === "drift",
      );
      if (prevIdx >= 0) {
        trace[prevIdx] = {
          ...state,
          checkId: instr.check_id,
          action: instr.action,
          outcome: "applied",
          reason: "drift recovered via fuzzy whitespace match",
        };
      }
    }
  }

  const counts: OutcomeCounts = {};
  for (const r of trace) counts[r.outcome] = (counts[r.outcome] ?? 0) + 1;

  const criticalUnresolved = trace.some((r) => {
    const instr = byId.get(r.checkId);
    return instr?.severity === "critical" && r.outcome !== "applied";
  });

  return { state, trace, escalations: sink.records, counts, criticalUnresolved };
}

/**
 * Fuzzy patch: match the `before` string after collapsing all whitespace runs
 * to single spaces on both sides. Used as a fallback when the exact string
 * can't be found (usually because other patches shifted whitespace/newlines).
 *
 * Returns the patched HTML if exactly one fuzzy occurrence exists, or null
 * for zero / multiple matches (we keep the uniqueness guarantee of
 * applyPatchHandler).
 */
function applyFuzzyPatch(html: string, before: string, after: string): string | null {
  const needle = before.replace(/\s+/g, " ").trim();
  if (needle.length < 20) return null; // too short to uniquely identify
  const normalized = html.replace(/\s+/g, " ");
  const firstIdx = normalized.indexOf(needle);
  if (firstIdx === -1) return null;
  if (normalized.indexOf(needle, firstIdx + needle.length) !== -1) return null;

  // Walk the original html character by character, skipping whitespace
  // differences, to locate the exact substring to replace.
  let h = 0;
  let n = 0;
  let spanStart = -1;
  while (h < html.length && n < needle.length) {
    const hc = html[h]!;
    const nc = needle[n]!;
    if (/\s/.test(hc) && /\s/.test(nc)) {
      // Consume whitespace run on both sides.
      while (h < html.length && /\s/.test(html[h]!)) h++;
      while (n < needle.length && /\s/.test(needle[n]!)) n++;
      continue;
    }
    if (hc === nc) {
      if (spanStart === -1) spanStart = h;
      h++;
      n++;
      continue;
    }
    // Mismatch — restart search past the current spanStart.
    if (spanStart === -1) {
      h++;
    } else {
      h = spanStart + 1;
      spanStart = -1;
      n = 0;
    }
  }
  if (n !== needle.length || spanStart === -1) return null;
  return html.slice(0, spanStart) + after + html.slice(h);
}

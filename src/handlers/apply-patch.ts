import type { HandlerResult, HandlerState, Instruction } from "./types.js";

// ─────────────────────────────────────────────────────────────────────────────
// apply_patch handler
//
// Blog-buster emits a `patch` envelope with exact `before` / `after` strings.
// Our job is to swap `before` → `after` in the HTML, but ONLY if:
//   1. `before` occurs exactly once in the HTML (no ambiguity)
//   2. `after` != `before` (no-op guard)
//
// If `before` occurs zero times → drift (source changed since audit).
// If `before` occurs multiple times → ambiguous (unsafe to replace blind).
//
// Both non-applied outcomes are downgraded to a soft "skipped" at the
// dispatcher layer so the outer loop can escalate repeatedly-failing checks
// rather than crash the run.
// ─────────────────────────────────────────────────────────────────────────────

export function applyPatchHandler(
  state: HandlerState,
  instruction: Instruction,
): HandlerResult {
  const base = {
    ...state,
    checkId: instruction.check_id,
    action: instruction.action,
  };

  const patch = instruction.patch;
  if (!patch) {
    return { ...base, outcome: "skipped", reason: "no patch envelope" };
  }

  if (patch.before === patch.after) {
    return { ...base, outcome: "skipped", reason: "before === after (no-op)" };
  }

  if (patch.before.length === 0) {
    return { ...base, outcome: "skipped", reason: "empty before string" };
  }

  const occurrences = countOccurrences(state.html, patch.before);

  if (occurrences === 0) {
    return {
      ...base,
      outcome: "drift",
      reason: `before string not found in html (patch type=${patch.type}, target=${patch.target})`,
    };
  }

  if (occurrences > 1) {
    return {
      ...base,
      outcome: "ambiguous",
      reason: `before string matches ${occurrences} locations — refusing to blind-replace`,
    };
  }

  const nextHtml =
    state.html.slice(0, state.html.indexOf(patch.before)) +
    patch.after +
    state.html.slice(state.html.indexOf(patch.before) + patch.before.length);

  return {
    ...base,
    html: nextHtml,
    outcome: "applied",
    reason: `replaced single occurrence (${patch.before.length}b → ${patch.after.length}b)`,
  };
}

function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) return 0;
  let count = 0;
  let i = 0;
  while ((i = haystack.indexOf(needle, i)) !== -1) {
    count++;
    i += needle.length;
  }
  return count;
}

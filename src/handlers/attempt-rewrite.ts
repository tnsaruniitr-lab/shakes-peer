import Anthropic from "@anthropic-ai/sdk";
import type { HandlerResult, HandlerState, Instruction } from "./types.js";

// ─────────────────────────────────────────────────────────────────────────────
// attempt_rewrite handler
//
// Blog-buster flags a passage as weak/banned/off-voice and asks us to rewrite.
// It gives us:
//   • patch.before  → exact HTML fragment to replace (the weak passage)
//   • patch.after   → its best-effort suggestion (often empty)
//   • instruction.evidence → human-readable reason (the rewrite brief)
//
// We call Claude Haiku 4.5 (cheap, fast — rewrites are low-risk) with the
// brief and the before-fragment, and replace in-place. If the rewrite looks
// degenerate (empty, too short, contains banned markers like "As an AI"),
// we skip and let the outer loop escalate.
//
// Opt-out: pass `runLlm=false` to get deterministic "skipped (llm disabled)"
// results — useful for unit tests and offline smoke runs.
// ─────────────────────────────────────────────────────────────────────────────

export interface RewriteDeps {
  runLlm: boolean;
  apiKey?: string;
  model?: string;
  // Injectable for tests.
  callClaude?: (prompt: string) => Promise<string>;
}

const BANNED_REWRITE_MARKERS = [
  /\bas an ai\b/i,
  /\bi cannot\b/i,
  /\bi am unable\b/i,
  /\bhere is the rewrite\b/i,
  /^sure[,.!]/i,
];

export async function attemptRewriteHandler(
  state: HandlerState,
  instruction: Instruction,
  deps: RewriteDeps,
): Promise<HandlerResult> {
  const base = {
    ...state,
    checkId: instruction.check_id,
    action: instruction.action,
  };

  const patch = instruction.patch;
  if (!patch || !patch.before) {
    return { ...base, outcome: "skipped", reason: "no patch/before to rewrite" };
  }

  if (!state.html.includes(patch.before)) {
    return { ...base, outcome: "drift", reason: "before snippet no longer in html" };
  }

  if (!deps.runLlm) {
    return { ...base, outcome: "skipped", reason: "llm rewrites disabled" };
  }

  const prompt = buildRewritePrompt(instruction, patch.before);
  let rewrite: string;
  try {
    rewrite = deps.callClaude
      ? (await deps.callClaude(prompt)).trim()
      : (await callClaudeDefault(prompt, deps.apiKey, deps.model)).trim();
  } catch (err) {
    return {
      ...base,
      outcome: "failed",
      reason: `claude call failed: ${(err as Error).message}`,
    };
  }

  if (!rewrite) {
    return { ...base, outcome: "skipped", reason: "rewrite empty" };
  }
  if (rewrite.length < Math.max(20, patch.before.length * 0.3)) {
    return { ...base, outcome: "skipped", reason: "rewrite too short" };
  }
  for (const banned of BANNED_REWRITE_MARKERS) {
    if (banned.test(rewrite)) {
      return { ...base, outcome: "skipped", reason: `rewrite contains banned marker ${banned}` };
    }
  }

  const nextHtml = state.html.replace(patch.before, rewrite);
  if (nextHtml === state.html) {
    return { ...base, outcome: "skipped", reason: "no-op (rewrite == before)" };
  }

  return {
    ...base,
    html: nextHtml,
    outcome: "applied",
    reason: `rewrote ${patch.before.length}b → ${rewrite.length}b`,
  };
}

function buildRewritePrompt(instruction: Instruction, before: string): string {
  return [
    "You are editing a single HTML fragment of a blog post.",
    "",
    "Audit finding:",
    instruction.evidence,
    "",
    "Rewrite the fragment below to address the finding. Rules:",
    "- Preserve the outer HTML tag structure exactly (same element types, same attributes).",
    "- Only change the human-visible copy inside.",
    "- Do NOT add commentary, preamble, or meta-text. Output ONLY the rewritten HTML.",
    "- Do NOT mention that you are an AI.",
    "- Keep factual content accurate — if in doubt, keep the original claim.",
    "",
    "Original fragment:",
    before,
    "",
    "Rewritten fragment:",
  ].join("\n");
}

async function callClaudeDefault(
  prompt: string,
  apiKey: string | undefined,
  model: string | undefined,
): Promise<string> {
  const key = apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  const client = new Anthropic({ apiKey: key });
  const resp = await client.messages.create({
    model: model ?? "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  return resp.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("\n");
}

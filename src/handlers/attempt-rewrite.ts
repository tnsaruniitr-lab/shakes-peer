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

// Check IDs where blog-buster rates on a 1-10 scale and requires ≥7 to pass.
// Each initial rewrite usually lifts the score 1-2 points; we retry up to
// THRESHOLD_RETRIES times per round, re-rewriting on top of the previous
// output until the handler detects "no more material to rewrite" or the
// threshold is plausibly hit.
const THRESHOLD_CHECK_PREFIXES = ["H_judge_", "Q_"];
const THRESHOLD_RETRIES = 2; // total Claude calls per finding = 1 + 2 = 3
const FIRST_PERSON_RE = /\b(I|I'm|I’ve|I'd|me|my|mine|we|we're|we’ve|our|ours|us)\b/i;
const CLINICAL_PERSONA_RE = /\b(gp|doctor|physician|patient|patients|clinic|clinician|medical director)\b/i;
const NUMBER_TOKEN_RE = /\b(?:AED\s*)?\d+(?:\.\d+)?\b|°C\b/i;

function isThresholdCheck(checkId: string): boolean {
  return THRESHOLD_CHECK_PREFIXES.some((p) => checkId.startsWith(p));
}

/**
 * Parse "N/10" out of the finding's evidence so we know how far we have to
 * push. Returns the current score or null if no score is present.
 */
function currentScore(evidence: string): number | null {
  const m = evidence.match(/(\d+)\s*\/\s*10\b/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

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
  const unsafeReason = detectUnsafeRewrite(patch.before, rewrite, instruction.check_id);
  if (unsafeReason) {
    return { ...base, outcome: "skipped", reason: unsafeReason };
  }

  let nextHtml = state.html.replace(patch.before, rewrite);
  if (nextHtml === state.html) {
    return { ...base, outcome: "skipped", reason: "no-op (rewrite == before)" };
  }
  let currentText = rewrite;
  let totalLifts = 1;

  // Push-to-threshold: for judge-rated checks below the 7/10 threshold,
  // call Claude up to THRESHOLD_RETRIES more times with an escalating prompt.
  // Each retry rewrites on top of the previous rewrite, pushing the score
  // further. We stop early if Claude returns an empty/degenerate result.
  if (isThresholdCheck(instruction.check_id)) {
    const score = currentScore(instruction.evidence);
    const target = 7;
    if (score !== null && score < target) {
      for (let retry = 0; retry < THRESHOLD_RETRIES; retry++) {
        const retryPrompt = buildPushPrompt(instruction, currentText, score, target, retry + 2);
        let harder: string;
        try {
          harder = deps.callClaude
            ? (await deps.callClaude(retryPrompt)).trim()
            : (await callClaudeDefault(retryPrompt, deps.apiKey, deps.model)).trim();
        } catch {
          break;
        }
        if (!harder || harder.length < Math.max(20, currentText.length * 0.3)) break;
        if (BANNED_REWRITE_MARKERS.some((r) => r.test(harder))) break;
        if (detectUnsafeRewrite(currentText, harder, instruction.check_id)) break;
        // Replace the previous rewrite in-place with the harder one.
        const beforeBlockInHtml = currentText;
        if (!nextHtml.includes(beforeBlockInHtml)) break;
        nextHtml = nextHtml.replace(beforeBlockInHtml, harder);
        currentText = harder;
        totalLifts++;
      }
    }
  }

  return {
    ...base,
    html: nextHtml,
    outcome: "applied",
    reason:
      totalLifts > 1
        ? `rewrote ${patch.before.length}b → ${currentText.length}b (push-to-threshold: ${totalLifts} passes)`
        : `rewrote ${patch.before.length}b → ${currentText.length}b`,
  };
}

function buildPushPrompt(
  instruction: Instruction,
  previousRewrite: string,
  startScore: number,
  targetScore: number,
  passNumber: number,
): string {
  return [
    "You are rewriting a blog fragment to raise its quality rating.",
    "",
    `Finding: ${instruction.evidence}`,
    `Starting score: ${startScore}/10 · Target: ${targetScore}+/10 · This is rewrite pass #${passNumber}.`,
    "",
    "The previous rewrite is BELOW the target. Push further using ONLY material already present:",
    "- Sharpen cadence and clarity. Use fresh phrasing the original doesn't use.",
    "- Add tonal warmth or empathy where it reads cold — without introducing new facts.",
    "- Strengthen point-of-view ONLY if the fragment already supports that stance.",
    "- Be more concrete, but ONLY using entities or facts already in the fragment. If there's nothing specific to leverage, tighten the sentence rather than invent.",
    "- Preserve the outer HTML tag structure exactly.",
    "- Output ONLY the rewritten HTML fragment. No preamble, no meta-commentary.",
    "",
    "FORBIDDEN fabrications (auto-rejected):",
    "- First-person writer experience not in the original.",
    "- New professional/clinical personas.",
    "- New numbers, prices, percentages, measurements, timelines.",
    "- Fictional patients, customers, case studies, or scenes.",
    "- Any named entity (brand, person, place) not already in the fragment.",
    "",
    "Previous rewrite:",
    previousRewrite,
    "",
    "Improved rewrite:",
  ].join("\n");
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
    "HUMANITY guidance (apply only if it fits the finding):",
    "- Add warmth, empathy, or tonal clarity ONLY if it can be done without introducing new facts.",
    "- You may improve cadence and emotional resonance, but do NOT invent lived experience, credentials, patient stories, or dramatic scenes.",
    "- Prefer grounded reader situations (\"if your routine no longer matches your real life...\") over writer-centered voice (\"I tried this last April...\").",
    "- If the fragment is too generic, make it more concrete using only entities or facts already present in the fragment.",
    "",
    "FORBIDDEN fabrications (these will be auto-rejected):",
    "- First-person experience the original didn't have (\"I tried...\", \"Last year I...\")",
    "- Clinician / coach / doctor persona unless the original fragment already establishes it",
    "- Patient stories, anonymised case studies, or dramatic scenes not in the original",
    "- New numbers, prices, percentages, measurements, credentials, or timelines",
    "- Named entities (brands, people, places) not present in the original",
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

function detectUnsafeRewrite(before: string, rewrite: string, checkId: string): string | null {
  if (!FIRST_PERSON_RE.test(before) && FIRST_PERSON_RE.test(rewrite)) {
    return "rewrite introduces unsupported first-person voice";
  }
  if (!CLINICAL_PERSONA_RE.test(before) && CLINICAL_PERSONA_RE.test(rewrite)) {
    return "rewrite introduces unsupported clinical persona";
  }

  if (checkId.startsWith("H_judge_") || checkId.startsWith("Q_")) {
    const beforeNumbers = new Set((before.match(/\b(?:AED\s*)?\d+(?:\.\d+)?\b|°C\b/g) ?? []).map((m) => m.toLowerCase()));
    const rewriteNumbers = new Set((rewrite.match(/\b(?:AED\s*)?\d+(?:\.\d+)?\b|°C\b/g) ?? []).map((m) => m.toLowerCase()));
    for (const token of rewriteNumbers) {
      if (!beforeNumbers.has(token)) {
        return "rewrite introduces unsupported numeric specificity";
      }
    }
  }

  return null;
}

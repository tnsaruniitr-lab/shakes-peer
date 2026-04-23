// Real end-to-end test: generate a fresh AnswerMonk AEO blog and run the full
// auto-edit loop. No cached seed — calls OpenAI for generation and Anthropic
// for the loop. Commits every version locally; push by default.
//
// Usage:
//   npm run build
//   node scripts/write-answermonk-aeo.mjs [--no-llm] [--no-push] [--max-rounds=N]
//
// Honesty note: `enforce_human_signals` is FALSE here. We don't have real
// author LinkedIn, real first-party data, real customer names, or real
// screenshots for AnswerMonk. The audit will flag these as open items —
// which is correct. Fabricating them would be fraud.

import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config({ override: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const runLlm = !process.argv.includes("--no-llm");
const push = !process.argv.includes("--no-push");
const maxRoundsArg = process.argv.find((a) => a.startsWith("--max-rounds="));
const maxRounds = maxRoundsArg ? Number(maxRoundsArg.split("=")[1]) : 2;

if (!process.env.OPENAI_API_KEY) {
  console.error("✗ OPENAI_API_KEY required for blog generation");
  process.exit(1);
}
if (runLlm && !process.env.ANTHROPIC_API_KEY) {
  console.error("✗ ANTHROPIC_API_KEY required for LLM layers (or pass --no-llm)");
  process.exit(1);
}

const request = {
  topic: "What is Answer Engine Optimization (AEO) and how does it work in 2026",
  primary_keyword: "answer engine optimization",
  secondary_keywords: [
    "AEO",
    "AEO vs SEO",
    "AI answer engines",
    "generative search optimization",
    "LLM visibility",
  ],
  search_intent: "informational",
  audience: "SEO and content marketing leaders at B2B SaaS companies",
  angle: "Practical definition + 2026 playbook for ranking in AI-generated answers",
  post_format: "article",
  enforce_human_signals: false, // we don't have real author data — loop will surface as open items
  first_party_data: [],
  named_examples: [],
  original_visuals: [],
  brand: {
    name: "AnswerMonk",
    domain: "answermonk.ai",
    product_description:
      "AnswerMonk is an Answer Engine Optimization platform that audits brand visibility across ChatGPT, Gemini, Claude, and Perplexity, and produces AI-ready content that gets cited by generative engines.",
    tone_of_voice: "clear, expert, practical — no fluff",
    differentiators: [
      "Tracks brand citations across ChatGPT, Gemini, Claude, and Perplexity in one dashboard",
      "Generates AI-ready content with schema + authority signals built in",
      "Monitors mention-share and sentiment in LLM responses over time",
    ],
  },
  sources: [
    {
      id: "geo-arxiv",
      title: "GEO: Generative Engine Optimization (arXiv 2311.09735)",
      url: "https://arxiv.org/abs/2311.09735",
      excerpt:
        "First academic framework for optimizing content to be cited by generative engines; identifies citation, quotation, and statistics as highest-impact signals.",
      authority_tier: "primary",
    },
    {
      id: "google-search-central",
      title: "Google Search Central — Helpful Content System",
      url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
      excerpt:
        "Google's guidance on people-first content, E-E-A-T signals, and the Helpful Content System used to rank pages.",
      authority_tier: "primary",
    },
    {
      id: "schema-org-defined-term",
      title: "schema.org — DefinedTerm",
      url: "https://schema.org/DefinedTerm",
      excerpt:
        "Structured-data type for defining terms in a glossary; read by Google and cited by LLMs.",
      authority_tier: "primary",
    },
    {
      id: "openai-cite",
      title: "OpenAI — How ChatGPT decides which sources to cite",
      url: "https://platform.openai.com/docs/guides/browse",
      excerpt:
        "OpenAI's documented behavior on source selection during browsing and search-grounded answers.",
      authority_tier: "primary",
    },
    {
      id: "semrush-aeo-2024",
      title: "Semrush — The State of Answer Engine Optimization 2024",
      url: "https://www.semrush.com/blog/aeo/",
      excerpt:
        "Industry analysis of how brand mentions in AI answers correlate with domain authority and schema coverage.",
      authority_tier: "industry",
    },
  ],
  article: {
    slug: "what-is-answer-engine-optimization",
    target_word_count: 1800,
    include_faq: true,
    include_howto_schema: false,
    include_comparison_table: true,
    author_name: "AnswerMonk Editorial",
    category: "AEO Fundamentals",
  },
  model: "gpt-4.1",
};

const { generateAndAutoEdit } = await import(
  path.join(ROOT, "dist", "blog", "auto-edit-pipeline.js")
);

console.log(`\n═══ Writing: ${request.topic} ═══`);
console.log(`  brand:     ${request.brand.name} (${request.brand.domain})`);
console.log(`  slug:      ${request.article.slug}`);
console.log(`  llm:       ${runLlm}    rounds: ${maxRounds}    push: ${push}`);
console.log(`  sources:   ${request.sources.length} (${request.sources.filter((s) => s.authority_tier === "primary").length} primary)`);

const start = Date.now();
let result;
try {
  result = await generateAndAutoEdit(request, {
    maxRounds,
    targetScore: 90,
    runLlm,
    push,
  });
} catch (err) {
  console.error("\n✗ pipeline threw:", err?.message ?? err);
  if (err?.issues) console.error(JSON.stringify(err.issues, null, 2));
  process.exit(1);
}
const elapsed = ((Date.now() - start) / 1000).toFixed(1);

console.log(`\n✓ Pipeline finished in ${elapsed}s`);
console.log(`═══════════ RESULT ═══════════`);
console.log(`  terminal:       ${result.terminal}`);
console.log(`  reason:         ${result.terminalReason}`);
console.log(`  versions:       ${result.versions}`);
console.log(`  finalScore:     ${result.finalScore}`);
console.log(`  totalCost:      $${result.totalCostUsd.toFixed(4)}`);
console.log(`  blogFolder:     ${path.relative(ROOT, result.blogFolder)}`);
console.log(`  commits:        ${result.commits.length}`);
for (const c of result.commits) {
  console.log(`    v${c.version}: ${c.sha?.slice(0, 8) ?? "(no commit)"}`);
}
console.log(`  pushed:         ${result.pushed}`);

console.log(`\n  History timeline:`);
for (const v of result.history.versions) {
  const ls = v.layerScores
    ? ` tech=${v.layerScores.technical} hum=${v.layerScores.humanization} qual=${v.layerScores.quality}`
    : "";
  const dc = v.dispatchCounts ? JSON.stringify(v.dispatchCounts) : "{}";
  console.log(
    `    v${v.version}: score=${v.score ?? "—"}${ls} crit=${v.criticalCount ?? "—"} cost=$${v.costUsd.toFixed(4)} dispatch=${dc}`,
  );
}

if (result.history.openItems.length > 0) {
  console.log(`\n  🔔 Open items (${result.history.openItems.length}):`);
  for (const item of result.history.openItems) {
    const fields = item.suggestedFields?.join(", ") ?? "—";
    console.log(`    • ${item.checkId} [${item.severity}] → needs: ${fields}`);
  }
}

console.log(`\n✓ README: ${path.relative(ROOT, path.join(result.blogFolder, "README.md"))}`);
console.log(`✓ Final:  ${path.relative(ROOT, path.join(result.blogFolder, "final/index.md"))}`);

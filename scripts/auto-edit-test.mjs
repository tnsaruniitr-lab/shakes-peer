// End-to-end auto-edit smoke test.
//
// Loads an existing Shakes-peer package, builds AuditOptions via the adapter,
// then drives shakes-peer's outer audit-loop (runAuditLoop) using blog-buster's
// audit() as the audit function. Handler dispatcher runs in DETERMINISTIC mode
// (no LLM rewrites) so the test is cheap and offline-friendly.
//
// Usage:
//   npm run build
//   node scripts/auto-edit-test.mjs [--with-llm] [--max-rounds=N]
//
// Prints a per-round dispatch summary + a final terminal-state verdict.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config({ override: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const { buildAuditOptions } = await import(path.join(ROOT, "dist", "blog", "blog-buster-adapter.js"));
const { runAuditLoop } = await import(path.join(ROOT, "dist", "blog", "audit-loop.js"));
const { audit } = await import("blog-buster");

const PACKAGE_PATH = path.join(
  ROOT,
  "examples",
  "generated",
  "answermonk-aeo-glossary-v3.package.json",
);

const withLlm = process.argv.includes("--with-llm");
const maxRoundsArg = process.argv.find((a) => a.startsWith("--max-rounds="));
const maxRounds = maxRoundsArg ? Number(maxRoundsArg.split("=")[1]) : 2;

if (withLlm && !process.env.ANTHROPIC_API_KEY) {
  console.error("✗ --with-llm requires ANTHROPIC_API_KEY");
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(PACKAGE_PATH, "utf-8"));
console.log(`✓ Loaded package: ${pkg.article.title}`);

const canonicalUrl =
  pkg.request.canonical_url ?? `https://${pkg.request.brand_name}.example.com/${pkg.article.slug}`;
const request = {
  topic: pkg.request.topic ?? pkg.article.title,
  primary_keyword: pkg.request.primary_keyword,
  secondary_keywords: pkg.request.secondary_keywords ?? [],
  search_intent: pkg.request.search_intent ?? "informational",
  audience: "SEO managers",
  angle: "",
  post_format: pkg.article.format ?? "article",
  enforce_human_signals: false,
  first_party_data: [],
  named_examples: [],
  original_visuals: [],
  brand: {
    name: pkg.request.brand_name,
    domain: new URL(canonicalUrl).hostname,
    product_description: "",
    tone_of_voice: "clear",
    differentiators: [],
  },
  sources: pkg.references ?? [],
  article: {
    slug: pkg.article.slug,
    target_word_count: 2000,
    include_faq: true,
    include_howto_schema: false,
    include_comparison_table: false,
    author_name: "Editorial",
    category: pkg.article.category ?? "Glossary",
  },
  model: "gpt-4.1",
};

const outputDir = path.join(ROOT, ".audit-cache", "auto-edit", new Date().toISOString().replace(/[:.]/g, "-"));
fs.mkdirSync(outputDir, { recursive: true });

// Mutable state that's fed back into each audit round.
let currentHtml = pkg.html;
let currentJsonLd = pkg.json_ld;
let currentMetaTags = pkg.metaTags ?? {};

const runAudit = async (state, round) => {
  currentHtml = state.html;
  currentJsonLd = state.jsonLd;
  currentMetaTags = state.metaTags ?? currentMetaTags;

  // Rebuild package with the current state so blog-buster sees our edits.
  const mutatedPkg = { ...pkg, html: currentHtml, json_ld: currentJsonLd };
  const options = buildAuditOptions({
    request,
    response: mutatedPkg,
    repoRoot: ROOT,
    outputDir: path.join(outputDir, `round-${round}`),
    runLlmLayers: withLlm,
    targetScore: 90,
  });
  fs.mkdirSync(options.outputDir, { recursive: true });

  console.log(`\n→ Round ${round}: calling audit()...`);
  const start = Date.now();
  const result = await audit(options);
  console.log(
    `✓ Round ${round}: score=${result.finalScore}/100 verdict=${result.verdict} critical=${result.criticalCount} instructions=${result.shakespeerInstructions.instructions.length} ($${result.totalCostUsd.toFixed(4)} / ${Date.now() - start}ms)`,
  );

  return {
    meta: {
      final_score: result.finalScore,
      critical_count: result.criticalCount,
      verdict: result.verdict,
      is_final: result.isFinal,
      target_score: result.shakespeerInstructions.meta.target_score,
      version: result.version,
    },
    fix_order: result.shakespeerInstructions.fix_order,
    instructions: result.shakespeerInstructions.instructions,
    regressions: (result.regressions ?? []).map((r) => ({
      checkId: r.checkId,
      status: r.status,
      severity: r.severity,
    })),
  };
};

const initialState = {
  html: pkg.html,
  jsonLd: pkg.json_ld,
  metaTags: currentMetaTags,
};

const loop = await runAuditLoop({
  initialState,
  runAudit,
  maxRounds,
  rewrite: { runLlm: withLlm },
});

console.log(`\n═══════════ TERMINAL: ${loop.terminal} ═══════════`);
console.log(`  reason: ${loop.reason}`);
console.log(`  rounds: ${loop.rounds.length}`);
for (const r of loop.rounds) {
  console.log(
    `  • round ${r.round}: score=${r.audit.final_score} verdict=${r.audit.verdict} critical=${r.audit.critical_count} dispatched=${JSON.stringify(r.dispatch.counts)}`,
  );
}
console.log(`  escalations: ${loop.totalEscalations.length}`);
for (const e of loop.totalEscalations) {
  console.log(`    ⚠ ${e.checkId} [${e.severity}] ${e.evidence.slice(0, 80)}`);
}

const reportPath = path.join(outputDir, "auto-edit-report.json");
fs.writeFileSync(
  reportPath,
  JSON.stringify(
    {
      terminal: loop.terminal,
      reason: loop.reason,
      rounds: loop.rounds.map((r) => ({
        round: r.round,
        audit: r.audit,
        counts: r.dispatch.counts,
        trace: r.dispatch.trace.map((t) => ({
          checkId: t.checkId,
          action: t.action,
          outcome: t.outcome,
          reason: t.reason,
        })),
      })),
      escalations: loop.totalEscalations,
      finalHtmlLength: loop.finalState.html.length,
    },
    null,
    2,
  ),
  "utf-8",
);
console.log(`\n✓ Report: ${path.relative(ROOT, reportPath)}`);

// Dump the final rewritten html for eyeballing.
fs.writeFileSync(path.join(outputDir, "final.html"), loop.finalState.html, "utf-8");
fs.writeFileSync(
  path.join(outputDir, "final.jsonld.json"),
  JSON.stringify(loop.finalState.jsonLd, null, 2),
  "utf-8",
);
console.log(`✓ Final html: ${path.relative(ROOT, path.join(outputDir, "final.html"))}`);

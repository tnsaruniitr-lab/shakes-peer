// Phase 1 smoke test — calls blog-buster.audit() end-to-end on an existing
// Shakes-peer package and prints a structured summary of the response.
//
// Purpose: prove the adapter + AuditOptions wiring work against the real
// blog-buster today (deterministic-only mode, no Anthropic calls needed),
// and dump the response shape into phase1-smoke-report.json for inspection.
//
// Usage:
//   npm run build
//   node scripts/smoke-test-blog-buster.mjs [--with-llm]
//     --with-llm  Run LLM layers too (requires ANTHROPIC_API_KEY)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// override: true is required — the shell has ANTHROPIC_API_KEY pre-set to ""
// from brandsmith's dev env, and plain dotenv.config() does not overwrite
// existing vars.
dotenv.config({ override: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const { toBloggerPost, buildAuditOptions } = await import(
  path.join(ROOT, "dist", "blog", "blog-buster-adapter.js")
);
const { audit } = await import("blog-buster");

const PACKAGE_PATH = path.join(
  ROOT,
  "examples",
  "generated",
  "answermonk-aeo-glossary-v3.package.json"
);

if (!fs.existsSync(PACKAGE_PATH)) {
  console.error(`✗ Package not found: ${PACKAGE_PATH}`);
  process.exit(1);
}

const withLlm = process.argv.includes("--with-llm");
if (withLlm && !process.env.ANTHROPIC_API_KEY) {
  console.error("✗ --with-llm requires ANTHROPIC_API_KEY in .env");
  process.exit(1);
}

// ─── 1. Load the Shakes-peer package ─────────────────────────────────────────
const pkg = JSON.parse(fs.readFileSync(PACKAGE_PATH, "utf-8"));
console.log(`✓ Loaded package: ${pkg.article.title}`);
console.log(`  slug=${pkg.article.slug}, html=${pkg.html.length}b, json_ld entities=${pkg.json_ld?.["@graph"]?.length ?? 0}`);

// ─── 2. Reconstruct the minimum request shape the adapter needs ──────────────
const canonicalUrl = pkg.request.canonical_url ?? `https://${pkg.request.brand_name}.example.com/${pkg.article.slug}`;
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

// ─── 3. Build the AuditOptions + BloggerPost via the adapter ────────────────
const outputDir = path.join(ROOT, ".audit-cache", "smoke", new Date().toISOString().replace(/[:.]/g, "-"));
fs.mkdirSync(outputDir, { recursive: true });

const options = buildAuditOptions({
  request,
  response: pkg,
  repoRoot: ROOT,
  outputDir,
  runLlmLayers: withLlm,
  targetScore: 90,
});

console.log(`\n✓ Built AuditOptions (llm=${options.runLlmLayers}, outputDir=${path.relative(ROOT, outputDir)})`);
console.log(`  BloggerPost: slug=${options.generatedPost.slug}, wordCount=${options.generatedPost.wordCount}, schemas=${options.generatedPost.jsonLdSchemas?.length}, meta keys=${Object.keys(options.generatedPost.metaTags ?? {}).length}`);

// ─── 4. Call audit() ─────────────────────────────────────────────────────────
console.log(`\n→ Calling audit()...`);
const start = Date.now();
let result;
try {
  result = await audit(options);
} catch (err) {
  console.error(`\n✗ audit() threw:`, err);
  process.exit(1);
}
const elapsed = Date.now() - start;
console.log(`✓ audit() returned in ${elapsed}ms`);

// ─── 5. Summarize ────────────────────────────────────────────────────────────
console.log(`\n───────── VERDICT ─────────`);
console.log(`  verdict:        ${result.verdict}`);
console.log(`  score:          ${result.finalScore}/100`);
console.log(`  critical:       ${result.criticalCount}`);
console.log(`  iterations:     ${result.iterationsCount}`);
console.log(`  version:        ${result.version}`);
console.log(`  isFinal:        ${result.isFinal}`);
console.log(`  status:         ${result.status}`);
console.log(`  stopReason:     ${result.stopReason}`);
console.log(`  totalCostUsd:   $${result.totalCostUsd.toFixed(4)}`);

const instructions = result.shakespeerInstructions?.instructions ?? [];
console.log(`\n───────── FIX PLAN (${instructions.length} instructions) ─────────`);
const byAction = instructions.reduce((acc, i) => {
  acc[i.action] = (acc[i.action] ?? 0) + 1;
  return acc;
}, {});
for (const [action, count] of Object.entries(byAction)) {
  console.log(`  ${action.padEnd(24)} ${count}`);
}

console.log(`\n───────── TOP 5 FINDINGS ─────────`);
for (const i of instructions.slice(0, 5)) {
  console.log(`  [${i.severity.padEnd(8)}] ${i.check_id.padEnd(40)} → ${i.action}`);
  if (i.evidence) console.log(`     evidence: ${i.evidence.slice(0, 180)}`);
}

if (result.regressions?.length) {
  console.log(`\n⚠ REGRESSIONS (${result.regressions.length})`);
  for (const r of result.regressions) {
    console.log(`  [${r.status}] ${r.checkId}`);
  }
} else {
  console.log(`\n✓ No regressions`);
}

// ─── 6. Dump the full response + options for inspection ──────────────────────
const reportPath = path.join(
  ROOT,
  "examples",
  "generated",
  "answermonk-aeo-glossary-v3.phase1-smoke-report.json"
);
fs.writeFileSync(
  reportPath,
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      duration_ms: elapsed,
      with_llm: withLlm,
      options_summary: {
        slug: options.generatedPost.slug,
        wordCount: options.generatedPost.wordCount,
        jsonld_count: options.generatedPost.jsonLdSchemas?.length,
        meta_count: Object.keys(options.generatedPost.metaTags ?? {}).length,
      },
      result,
    },
    null,
    2
  ),
  "utf-8"
);
console.log(`\n✓ Full report dumped to ${path.relative(ROOT, reportPath)}`);

// ─── 7. Handshake-contract checks ────────────────────────────────────────────
console.log(`\n───────── CONTRACT CHECKS ─────────`);

const allowedActions = new Set([
  "apply_patch",
  "edit_schema",
  "insert_missing",
  "attempt_rewrite",
  "human_fix_required",
]);
const unknownActions = instructions
  .map((i) => i.action)
  .filter((a) => !allowedActions.has(a));
if (unknownActions.length > 0) {
  console.log(`  ✗ Unknown actions in response: ${[...new Set(unknownActions)].join(", ")}`);
} else {
  console.log(`  ✓ All instruction actions within allowed taxonomy`);
}

const criticalInstructions = instructions.filter((i) => i.severity === "critical");
const criticalWithoutPatch = criticalInstructions.filter((i) => !i.patch);
if (criticalWithoutPatch.length > 0) {
  console.log(
    `  ⓘ ${criticalWithoutPatch.length} critical finding(s) without a patch → action should be human_fix_required`
  );
  for (const c of criticalWithoutPatch) {
    const ok = c.action === "human_fix_required";
    console.log(`     ${ok ? "✓" : "✗"} ${c.check_id}: action=${c.action}`);
  }
}

// Check that files only landed under outputDir.
const cacheTree = [];
(function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else cacheTree.push(path.relative(ROOT, full));
  }
})(outputDir);
console.log(`  ✓ ${cacheTree.length} file(s) written to outputDir (expected — blog-buster's artifacts)`);
if (cacheTree.some((p) => !p.startsWith(".audit-cache/"))) {
  console.log(`  ✗ Files written outside outputDir — contract violation`);
}

console.log(`\n✓ Smoke test complete\n`);

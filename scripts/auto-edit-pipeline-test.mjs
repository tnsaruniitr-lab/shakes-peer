// Exercises the full auto-edit pipeline (generate → loop → versioned commits)
// but skips the OpenAI writer by using an existing Shakes-peer package as the
// v1 seed. That isolates the loop + version-store + git-commit plumbing.
//
// Usage:
//   npm run build
//   node scripts/auto-edit-pipeline-test.mjs [--with-llm] [--max-rounds=N] [--no-push]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config({ override: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const withLlm = process.argv.includes("--with-llm");
const maxRoundsArg = process.argv.find((a) => a.startsWith("--max-rounds="));
const maxRounds = maxRoundsArg ? Number(maxRoundsArg.split("=")[1]) : 1;
const push = !process.argv.includes("--no-push");

if (withLlm && !process.env.ANTHROPIC_API_KEY) {
  console.error("✗ --with-llm requires ANTHROPIC_API_KEY");
  process.exit(1);
}

const PACKAGE_PATH = path.join(
  ROOT,
  "examples",
  "generated",
  "answermonk-aeo-glossary-v3.package.json",
);
const pkg = JSON.parse(fs.readFileSync(PACKAGE_PATH, "utf-8"));

// Reconstruct the minimum request shape.
const canonicalUrl =
  pkg.request.canonical_url ??
  `https://${pkg.request.brand_name}.example.com/${pkg.article.slug}`;
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
    product_description: "AEO glossary platform",
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

const { generateAndAutoEdit } = await import(path.join(ROOT, "dist", "blog", "auto-edit-pipeline.js"));
console.log("✓ Using cached v1 package (skipping OpenAI generation)");

console.log(`\n→ Running auto-edit pipeline (llm=${withLlm}, rounds=${maxRounds}, push=${push})`);
const start = Date.now();
let result;
try {
  result = await generateAndAutoEdit(request, {
    maxRounds,
    targetScore: 90,
    runLlm: withLlm,
    push,
    seedPackage: pkg,
  });
} catch (err) {
  console.error("\n✗ pipeline threw:", err);
  process.exit(1);
}

console.log(`\n✓ Pipeline finished in ${((Date.now() - start) / 1000).toFixed(1)}s`);
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
  console.log(
    `    v${v.version}: score=${v.score ?? "—"}${ls} crit=${v.criticalCount ?? "—"} cost=$${v.costUsd.toFixed(4)} dispatch=${JSON.stringify(v.dispatchCounts ?? {})}`,
  );
}
console.log(`\n✓ README at ${path.relative(ROOT, path.join(result.blogFolder, "README.md"))}`);

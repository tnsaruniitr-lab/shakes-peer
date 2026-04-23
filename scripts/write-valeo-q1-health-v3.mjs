// Valeo Health — Q1 Health Check 2026 Wellness Goals
//
// Path B run: Brandsmith-enriched brand data + Valeo-specific content brief
// with UAE/AED context embedded in `angle`. No full locale threading yet —
// the writer picks up locale signals via the angle/audience/brand fields that
// Brandsmith already provides.
//
// Usage:
//   npm run build
//   node scripts/write-valeo-q1-health.mjs [--no-llm] [--no-push] [--max-rounds=N]

import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config({ override: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const runLlm = !process.argv.includes("--no-llm");
const push = !process.argv.includes("--no-push");
const maxRoundsArg = process.argv.find((a) => a.startsWith("--max-rounds="));
const maxRounds = maxRoundsArg ? Number(maxRoundsArg.split("=")[1]) : 3;

if (!process.env.OPENAI_API_KEY) {
  console.error("✗ OPENAI_API_KEY required"); process.exit(1);
}
if (runLlm && !process.env.ANTHROPIC_API_KEY) {
  console.error("✗ ANTHROPIC_API_KEY required for --with-llm"); process.exit(1);
}

const request = {
  topic: "Q1 2026 Health Check: How to Audit Your Wellness Goals and Stay on Track",
  primary_keyword: "q1 health check",
  secondary_keywords: [
    "2026 wellness goals",
    "health check up dubai",
    "annual health screening uae",
    "q1 wellness review",
    "new year health goals",
  ],
  search_intent: "informational",
  audience: "Health-conscious residents in the UAE — expats and affluent locals in Dubai and Abu Dhabi who set wellness goals in January and want a pragmatic Q1 review",
  angle:
    "A non-judgemental, pragmatic Q1 check-in framework Dubai readers can do in 15 minutes. " +
    "Localise every example to UAE context: use AED for any price references (format as 'AED 1,200'), " +
    "use day-month date format ('19 March 2026' or 'Mar 19'), and reference Dubai-specific factors like " +
    "Ramadan timing, summer heat constraints, and DHA-aligned preventive screenings. " +
    "Use occasional 'Friendly note:' callouts (1-2 sentences) as a known Valeo blog pattern. " +
    "Tone: warm, encouraging, pragmatic, non-judgemental, clinically grounded. " +
    "Do NOT invent US pricing or US-centric regulators.",
  post_format: "article",
  enforce_human_signals: false, // no real author/LinkedIn yet → will surface as open item
  first_party_data: [],
  named_examples: [],
  original_visuals: [],
  brand: {
    name: "Valeo Health",
    domain: "feelvaleo.com",
    product_description:
      "Valeo Health is a UAE direct-to-consumer at-home healthcare platform offering blood test packages, preventive screenings, metabolic health programmes, and personalised wellness coaching for Dubai residents.",
    tone_of_voice: "warm, encouraging, pragmatic, non-judgemental, clinically grounded",
    differentiators: [
      "At-home sample collection across Dubai and Abu Dhabi",
      "Personalised wellness coaching from qualified dieticians and coaches",
      "Integrated blood test packages with same-week results",
      "Preventive health programmes designed for UAE lifestyle and climate",
    ],
    founder: undefined,
    twitter_handle: undefined,
  },
  sources: [
    {
      id: "who-healthy-adults",
      title: "WHO — Promoting well-being and addressing the wider determinants of health",
      url: "https://www.who.int/health-topics/well-being",
      excerpt:
        "World Health Organization framework for holistic well-being, covering physical, mental, and social dimensions of health.",
      authority_tier: "primary",
    },
    {
      id: "dha-preventive",
      title: "Dubai Health Authority — Preventive Health Screenings",
      url: "https://www.dha.gov.ae/en/services/preventive-health-services",
      excerpt:
        "DHA guidelines on preventive screenings for UAE residents, including age-based recommendations for blood panels, metabolic markers, and cardiovascular risk.",
      authority_tier: "primary",
    },
    {
      id: "bmj-goal-setting",
      title: "BMJ — Goal setting and review in clinical practice",
      url: "https://www.bmj.com/content/374/bmj.n1982",
      excerpt:
        "Peer-reviewed evidence on quarterly goal review cadences in chronic-condition management; shorter review cycles correlate with better adherence and outcomes.",
      authority_tier: "primary",
    },
    {
      id: "mohap-nutrition",
      title: "UAE Ministry of Health and Prevention — Nutrition Guidelines for Adults",
      url: "https://mohap.gov.ae/en/services/nutrition-guidelines",
      excerpt:
        "MOHAP's nutritional guidance tailored for UAE adults, accounting for regional dietary patterns and climate-related hydration needs.",
      authority_tier: "primary",
    },
    {
      id: "lancet-behaviour-change",
      title: "The Lancet — Behaviour change for health: evidence and challenges",
      url: "https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(18)30311-6",
      excerpt:
        "Lancet review on the psychology of long-term behaviour change; identifies quarterly self-review as a key adherence mechanism.",
      authority_tier: "primary",
    },
  ],
  article: {
    slug: "q1-health-check-2026-wellness-goals-v3",
    target_word_count: 1600,
    include_faq: true,
    include_howto_schema: true, // it's a practical "how to audit your goals" framing
    include_comparison_table: false,
    author_name: "Valeo Health Editorial",
    category: "Wellness",
  },
  model: "gpt-4.1",
};

const { generateAndAutoEdit } = await import(
  path.join(ROOT, "dist", "blog", "auto-edit-pipeline.js")
);

console.log(`\n═══ Writing Valeo Health — ${request.topic} ═══`);
console.log(`  brand:    ${request.brand.name} (${request.brand.domain})`);
console.log(`  slug:     ${request.article.slug}`);
console.log(`  target:   ${request.article.target_word_count}w · ${request.post_format}`);
console.log(`  llm:      ${runLlm}    rounds: ${maxRounds}    push: ${push}`);
console.log(`  sources:  ${request.sources.length} (${request.sources.filter((s) => s.authority_tier === "primary").length} primary — WHO / DHA / MOHAP / BMJ / Lancet)`);

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
console.log(`  terminal:      ${result.terminal}`);
console.log(`  reason:        ${result.terminalReason}`);
console.log(`  versions:      ${result.versions}`);
console.log(`  finalScore:    ${result.finalScore}`);
console.log(`  totalCost:     $${result.totalCostUsd.toFixed(4)}`);
console.log(`  blogFolder:    ${path.relative(ROOT, result.blogFolder)}`);
console.log(`  pushed:        ${result.pushed}`);
if (result.brandsmith) {
  console.log(`  brandsmith:    brand #${result.brandsmith.brandId} (${result.brandsmith.brandName}) — filled ${result.brandsmith.fieldsPopulated.length} field(s): ${result.brandsmith.fieldsPopulated.join(", ") || "(none — caller provided all)"}`);
}
console.log(`  commits:       ${result.commits.length}`);
for (const c of result.commits) {
  console.log(`    v${c.version}: ${c.sha?.slice(0, 8) ?? "(none)"}`);
}

console.log(`\n  History timeline:`);
for (const v of result.history.versions) {
  const ls = v.layerScores
    ? ` tech=${v.layerScores.technical} hum=${v.layerScores.humanization} qual=${v.layerScores.quality}`
    : "";
  const dc = v.dispatchCounts ? JSON.stringify(v.dispatchCounts) : "{}";
  console.log(`    v${v.version}: score=${v.score ?? "—"}${ls} crit=${v.criticalCount ?? "—"} cost=$${v.costUsd.toFixed(4)} dispatch=${dc}`);
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

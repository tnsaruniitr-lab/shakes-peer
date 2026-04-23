// TRYPS — Best Group Trip Planning Apps (2026 Comparison)
//
// Mirrors the structure of trypsagent.com/blog/best-group-trip-planning-apps-2026:
//   - 5 apps compared: TRYPS, Wanderlog, Splitwise, Troupe, SquadTrip
//   - 5 criteria: date poll, itinerary, expense split, no-signup, price
//   - Quick answer block + comparison table + key takeaways + FAQ + CTA
//   - Audience: friend group organizers (casual trips, not business)
//   - Voice: direct, conversational, pragmatic (inherits from brand/tryps-brand.md
//     which src/blog/brand-context.ts auto-loads for trypsagent.com)
//
// Note: TRYPS is the publisher, so the post is promotional in honest terms —
// the angle explicitly tells the writer to acknowledge authorship at the top.

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
  console.error("✗ ANTHROPIC_API_KEY required for LLM layers"); process.exit(1);
}

const request = {
  topic: "Best Group Trip Planning App for Friends — 2026 Comparison",
  primary_keyword: "best group trip planning app",
  secondary_keywords: [
    "group trip planning app 2026",
    "trip planning app for friends",
    "group travel planning tools",
    "best travel app for group trips",
    "group itinerary app",
  ],
  search_intent: "commercial",
  audience:
    "Friend-group organizers planning casual trips — birthdays, bachelor/bachelorette parties, reunions, weekend getaways. Not business travelers. They're juggling date polls, side chats, and spreadsheets, and want one tool that replaces them.",
  angle:
    "Head-to-head comparison of 5 group trip planning apps: TRYPS, Wanderlog, Splitwise, Troupe, SquadTrip. " +
    "Each gets compared on five concrete criteria: date polling, itinerary building, expense splitting, no-signup requirement, and price. " +
    "TRYPS is the publisher — acknowledge that honestly in the intro (one line like 'We built TRYPS, so we'll be upfront about that'). " +
    "Then give an honest pros/cons on every app including TRYPS. Do not hide TRYPS's limitations. " +
    "Tone: direct, conversational, pragmatic. No corporate language. Short sentences. " +
    "Example phrasing the existing TRYPS blog uses well: 'If you're tired of juggling polls, spreadsheets, and side chats…' or 'Send one link. Get your group moving.' " +
    "Include a comparison table with 5 rows × 5 columns. End with FAQ covering how TRYPS differs from Wanderlog, whether Splitwise plans trips or just splits bills, and which app works best for 4-8 person trips.",
  post_format: "comparison",
  enforce_human_signals: false,
  first_party_data: [],
  named_examples: [],
  original_visuals: [],
  brand: {
    name: "TRYPS",
    domain: "trypsagent.com",
    product_description:
      "TRYPS is a group trip planning app built for friends. It replaces date polls, spreadsheets, and side chats with a single shared link: the group picks dates, builds an itinerary, and splits expenses without anyone signing up.",
    tone_of_voice: "direct, conversational, pragmatic — short sentences, no corporate language",
    differentiators: [
      "No sign-up required for group members — just share a link",
      "Date polling, itinerary building, and expense splitting in one place (not three separate tools)",
      "Free to start — no credit card for the core planning flow",
      "Designed for small friend groups (4–10 people), not enterprise travel teams",
    ],
    founder: "Arun Sharma",
    twitter_handle: "@trypsapp",
  },
  sources: [
    // For a comparison listicle, sources are the apps themselves + independent reviews.
    {
      id: "wanderlog-site",
      title: "Wanderlog — Trip planning, itinerary, and travel app",
      url: "https://wanderlog.com/",
      excerpt:
        "Wanderlog markets itself as a trip planning + itinerary tool with route mapping and offline access; used widely by solo and small-group travelers.",
      authority_tier: "industry",
    },
    {
      id: "splitwise-site",
      title: "Splitwise — Split expenses with friends",
      url: "https://www.splitwise.com/",
      excerpt:
        "Splitwise specializes in expense splitting and settlement reminders; does not offer itinerary building or date polling.",
      authority_tier: "industry",
    },
    {
      id: "troupe-site",
      title: "Troupe — Planning group trips together",
      url: "https://www.troupe.com/",
      excerpt:
        "Troupe focuses on group trip polling and voting on hotels and activities; no built-in expense splitting.",
      authority_tier: "industry",
    },
    {
      id: "squadtrip-site",
      title: "SquadTrip — Host and manage group trips",
      url: "https://squadtrip.com/",
      excerpt:
        "SquadTrip is aimed at paid group-trip hosts and travel organizers running multi-trip businesses; different audience from friend-group planners.",
      authority_tier: "industry",
    },
    {
      id: "google-travel-trends",
      title: "Google — Travel and Tourism Insights",
      url: "https://www.google.com/travel/research/",
      excerpt:
        "Google's trend data on travel planning behavior, including the rise of multi-friend coordination searches year over year.",
      authority_tier: "primary",
    },
  ],
  article: {
    slug: "best-group-trip-planning-apps-2026",
    target_word_count: 1700,
    include_faq: true,
    include_howto_schema: false,
    include_comparison_table: true,
    author_name: "TRYPS Editorial",
    category: "Trip Planning",
    cta_label: "Start planning free",
    cta_url: "https://trypsagent.com",
  },
  model: "gpt-4.1",
};

const { generateAndAutoEdit } = await import(
  path.join(ROOT, "dist", "blog", "auto-edit-pipeline.js")
);

console.log(`\n═══ Writing TRYPS — ${request.topic} ═══`);
console.log(`  brand:    ${request.brand.name} (${request.brand.domain})`);
console.log(`  slug:     ${request.article.slug}`);
console.log(`  format:   ${request.post_format} · ${request.article.target_word_count}w target`);
console.log(`  apps:     TRYPS vs Wanderlog vs Splitwise vs Troupe vs SquadTrip`);
console.log(`  llm:      ${runLlm}    rounds: ${maxRounds}    push: ${push}`);

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
  const filled = result.brandsmith.fieldsPopulated.join(", ") || "(none — caller provided all)";
  console.log(`  brandsmith:    brand #${result.brandsmith.brandId} (${result.brandsmith.brandName}) filled: ${filled}`);
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
console.log(`✓ HTML:   ${path.relative(ROOT, path.join(result.blogFolder, "final/index.html"))}`);

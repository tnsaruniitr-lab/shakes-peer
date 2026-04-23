// TRYPS — 7-Day Oahu Group Trip Itinerary (2026)
//
// Mirrors the structure of trypsagent.com/blog/oahu-group-trip-itinerary-v3:
//   - 7-day day-by-day itinerary
//   - Pre-trip checklist
//   - Budget breakdown (accommodation, food, activities, transport, incidentals)
//   - Seasonal comparison (April-June, July-Aug, Nov-Mar)
//   - FAQ (~11 questions)
//   - ~2200 words · 8 min read
//   - Pragmatic · casual-confident · advice-forward voice
//   - Prices in USD with ranges, group-split emphasized
//   - TRYPS as soft CTA only — not product-heavy
//
// Uses batch-1 prompt upgrades (banned phrases, specificity quota,
// intro-earns-attention rule, source-adversarial treatment) + brand/tryps-brand.md
// voice context auto-loaded by the writer.

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
  topic: "7-Day Oahu Group Trip Itinerary: What Actually Works for Friend Groups",
  primary_keyword: "oahu group trip itinerary",
  secondary_keywords: [
    "oahu itinerary 7 days",
    "oahu group travel",
    "hawaii friends trip",
    "oahu trip planning",
    "group trip oahu",
  ],
  search_intent: "informational",
  audience:
    "Friend-group organizers (4–8 people) planning a 7-day Oahu trip. They're stuck in the coordination chaos phase: one person wants beach days, one wants to eat every two hours, nobody has booked anything, the group chat is a mess.",
  angle: [
    "Write a 7-day day-by-day Oahu itinerary (Day 1 through Day 7) using ONLY real places listed below. Do NOT invent restaurants, businesses, or beaches that aren't in this list.",
    "",
    "Real Oahu places to draw from (use these names verbatim):",
    "BEACHES: Kaimana Beach (Sans Souci), Waikiki Beach, Sunset Beach, Pipeline (Ehukai Beach Park), Waimea Bay, Kailua Beach, Ala Moana Beach Park, Laniakea Beach (turtles).",
    "RESTAURANTS & FOOD: Duke's Waikiki (beachfront, mai tais), Leonard's Bakery (malasadas), Marukame Udon (fast udon), Ono Seafood (poke), The Pig and the Lady (Chinatown), Livestock Tavern, Rainbow Drive-In (plate lunch), Cinnamon's Restaurant (breakfast), Eggs 'n Things (breakfast), MW Restaurant, Mahina & Sun's (Surfjack Hotel), Side Street Inn.",
    "SNACKS/TRUCKS: Matsumoto's Shave Ice (Haleiwa), Giovanni's Shrimp Truck (Kahuku).",
    "ACTIVITIES/LANDMARKS: Diamond Head Crater (reservation required for non-residents, $5 entry), Hanauma Bay (reservation required, $25 entry per non-resident, closed Mondays + Tuesdays), Mokulua Islands kayak (from Kailua), Tantalus Lookout (Puu Ualakaa State Park) for sunset, Bishop Museum, Waikiki Beach Boys (surf lessons), Chinatown walk.",
    "ACCOMMODATIONS: Outrigger Waikiki (beachfront), Alohilani (central Waikiki), Ala Moana vacation rentals (better for groups).",
    "BARS: Bar 35 (Chinatown), Tchin Tchin.",
    "",
    "Structure the 7 days deliberately:",
    "- Day 1: Arrival, low-energy day (don't fight jet lag). Suggest Kaimana Beach or Waikiki stroll, dinner at Duke's Waikiki or Rainbow Drive-In.",
    "- Day 2: Diamond Head sunrise hike + breakfast at Leonard's or Cinnamon's, afternoon Waikiki, sunset at Tantalus.",
    "- Day 3: Hanauma Bay morning snorkel (booked ahead), lunch at Ono Seafood, afternoon rest, dinner at MW Restaurant.",
    "- Day 4: North Shore day trip — Sunset Beach, Pipeline viewing, Matsumoto's Shave Ice, Giovanni's Shrimp Truck, Laniakea turtles.",
    "- Day 5: Kailua + Mokulua Islands kayak (or rental), lunch at Kailua Beach, dinner at The Pig and the Lady or Livestock Tavern in Chinatown, drinks at Bar 35.",
    "- Day 6: Culture day — Bishop Museum morning, Chinatown afternoon, surf lesson with Waikiki Beach Boys if group wants, dinner at Mahina & Sun's.",
    "- Day 7: Easy morning — breakfast at Eggs 'n Things, Ala Moana Beach Park or shopping, departure.",
    "",
    "Include budget breakdown table for a 4-person group (per person): Accommodation $1,050-$1,750 (split vacation rental 4-6 ways), Food $400-$600, Activities $250-$400, Transport $150-$250 (rental car split), Incidentals $100-$150. Total range $1,950-$3,150/person for 7 days.",
    "",
    "Include seasonal timing table: April-June (Best — dry, fewer crowds), July-August (Busy — family season, higher prices), September-October (Quiet — good weather, fewer crowds), November-March (Best for surf — North Shore waves, variable weather elsewhere).",
    "",
    "Pre-trip checklist (before you leave home):",
    "- Book Hanauma Bay reservation (48hr window, closes fast)",
    "- Book Diamond Head reservation for non-residents",
    "- Rent a car at least one of the days for North Shore (rideshare is spotty outside Honolulu)",
    "- Decide accommodation: hotel vs vacation rental — rentals save money for 4+ people",
    "",
    "End with 7-10 FAQs covering: when is best time to visit Oahu as a group, how much does a 7-day Oahu group trip cost per person, do you need a car in Oahu, can you do Hanauma Bay without a reservation (no), is Oahu family-friendly, how early do beaches get crowded, what's the best area to stay as a group (Waikiki vs Ala Moana vs Kailua), which Oahu day trip from Waikiki is best, is Pearl Harbor worth it on a group trip, how do you split costs fairly across the group.",
    "",
    "Voice: pragmatic, casual-confident, advice-forward. Short sentences. No corporate tone. Examples of voice to match: 'Don't fight this' / 'Non-negotiable' / 'Here's a day-by-day plan with real places, real food, and enough structure that the group chat can finally go quiet.' / 'It's touristy, yes — but it's open-air, reliably good, and right on the beach.'",
    "",
    "TRYPS is the publisher. Mention TRYPS ONCE at the bottom as a soft CTA ('Plan your Oahu trip without the usual chaos — start with TRYPS'). Do NOT turn the post into a product pitch. The post is editorial; TRYPS is the publisher that benefits from readers who end up needing a group planner.",
  ].join("\n"),
  post_format: "destination_guide",
  enforce_human_signals: false,
  first_party_data: [],
  named_examples: [],
  original_visuals: [],
  brand: {
    name: "TRYPS",
    domain: "trypsagent.com",
    product_description:
      "TRYPS is a group trip planning app built for friends. Replaces date polls, spreadsheets, and side chats with a single shared link for date polling, itinerary building, and expense splitting — no sign-up required for the group.",
    tone_of_voice: "direct, warm, slightly dry, advice-forward — short sentences, no corporate language",
    differentiators: [
      "No sign-up required for group members — just share a link",
      "Date polling + itinerary + expense splitting in one place",
      "Free to start — no credit card for core flow",
      "Designed for small friend groups (4–10 people)",
    ],
    founder: "Arun Sharma",
    twitter_handle: "@trypsapp",
  },
  sources: [
    {
      id: "gohawaii-oahu",
      title: "Hawaii Tourism Authority — Oahu",
      url: "https://www.gohawaii.com/islands/oahu",
      excerpt:
        "Official Oahu visitor guide from Hawaii Tourism Authority: neighborhoods, beaches, cultural sites, seasonal weather, and visitor guidelines.",
      authority_tier: "primary",
    },
    {
      id: "hanauma-bay-official",
      title: "Honolulu Parks & Rec — Hanauma Bay Nature Preserve",
      url: "https://www.honolulu.gov/parks/hbay.html",
      excerpt:
        "Official Hanauma Bay reservation system: $25 non-resident entry, mandatory 2-day advance reservation, closed Mondays and Tuesdays, education video required before swim.",
      authority_tier: "primary",
    },
    {
      id: "diamond-head-reservation",
      title: "Hawaii State Parks — Diamond Head State Monument Reservations",
      url: "https://gostateparks.hawaii.gov/diamondhead",
      excerpt:
        "Diamond Head reservation system for non-Hawaii residents: $5 entry, timed entry reservations required, summit trail is 0.8 miles one-way with elevation gain.",
      authority_tier: "primary",
    },
    {
      id: "oahu-visitors-bureau",
      title: "Oahu Visitors Bureau — Planning Guide",
      url: "https://www.visit-oahu.com/",
      excerpt:
        "Oahu Visitors Bureau trip planning resources covering neighborhoods, group travel logistics, seasonal considerations, and regional highlights (North Shore, Windward, South Shore).",
      authority_tier: "industry",
    },
    {
      id: "nps-pearl-harbor",
      title: "National Park Service — World War II Valor in the Pacific / Pearl Harbor",
      url: "https://www.nps.gov/perl/index.htm",
      excerpt:
        "NPS Pearl Harbor National Memorial: free USS Arizona Memorial program, timed-entry ticket system, separate $ for USS Missouri and Bowfin.",
      authority_tier: "primary",
    },
  ],
  article: {
    slug: "oahu-group-trip-itinerary-v3",
    target_word_count: 2200,
    include_faq: true,
    include_howto_schema: false,
    include_comparison_table: true,
    author_name: "TRYPS Editorial",
    category: "Trip Planning",
    cta_label: "Plan your Oahu trip",
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

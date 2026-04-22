import type { AnalyzeRequest, AnalyzeResponse, IntentType, Grade } from "./types.js";
import type { SourceAnalysis, SourceGap, CompetingPerson, SourceCategory } from "./source-analyzer.js";

const CATEGORY_DISPLAY: Record<SourceCategory, string> = {
  owned: "Owned Website",
  social: "Social Profiles",
  authority: "Authority Sources",
  press: "Press & News",
  media: "Media (Video/Podcast)",
  professional_directory: "Professional Directories",
  scraper_directory: "Scraper/Aggregator Directories",
  academic: "Academic",
  legal: "Legal",
  review: "Review Sites",
  other: "Other",
};

const STATUS_ICONS: Record<string, string> = {
  missing: "✗",
  weak: "⚠",
  strong: "✓",
};

export function generateReport(
  response: AnalyzeResponse,
  sourceAnalysis: SourceAnalysis,
  input: AnalyzeRequest
): string {
  const lines: string[] = [];
  const s = response.summary;

  // ── Header ──
  lines.push("═".repeat(60));
  lines.push(`PERSONAL BRAND SERP AUDIT — ${response.person}`);
  lines.push("═".repeat(60));

  const score = calculateOverallScore(response, sourceAnalysis);
  const scoreLabel = score >= 70 ? "Strong" : score >= 40 ? "Needs Work" : "Weak";
  lines.push(`Overall Score: ${score}/100 (${scoreLabel})`);
  lines.push(
    `Date: ${new Date(response.timestamp).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} | Country: ${response.metadata.country.toUpperCase()} | Provider: SerpApi`
  );
  lines.push("");

  // ── 1. Rankings ──
  lines.push("─".repeat(60));
  lines.push("1. YOUR RANKINGS");
  lines.push("─".repeat(60));
  lines.push("");
  lines.push(
    padRight("How people search", 38) +
    padRight("Rank", 10) +
    padRight("Grade", 8) +
    "Consistency"
  );
  lines.push(
    padRight("─".repeat(36), 38) +
    padRight("─".repeat(8), 10) +
    padRight("─".repeat(6), 8) +
    "─".repeat(11)
  );

  const intents: IntentType[] = ["name_search", "name_context", "category", "contextual"];
  for (const intent of intents) {
    const data = s.position_map[intent];
    if (data.queries.length === 0) continue;
    const rankStr = data.median_position !== null ? `#${data.median_position}` : "Not found";
    lines.push(
      padRight(`"${truncate(data.queries[0]?.query ?? intent, 34)}"`, 38) +
      padRight(rankStr, 10) +
      padRight(data.grade, 8) +
      data.consistency
    );

    // Show individual queries
    for (const q of data.queries) {
      const posStr = q.position !== null ? `#${q.position}` : "—";
      lines.push(`  ${truncate(q.query, 44)} → ${posStr}`);
    }
    lines.push("");
  }

  // Ranking summary
  const presentIntents = intents.filter((i) => s.position_map[i].median_position !== null);
  if (presentIntents.length > 0 && s.discoverability.overall_median_position !== null) {
    lines.push(
      `Summary: You rank #${s.discoverability.overall_median_position} on average across ${presentIntents.length} intent(s) where found.`
    );
  }
  const missingIntents = intents.filter(
    (i) => s.position_map[i].queries.length > 0 && s.position_map[i].median_position === null
  );
  if (missingIntents.length > 0) {
    lines.push(
      `Not found in: ${missingIntents.map((i) => s.position_map[i].label).join(", ")}`
    );
  }
  lines.push("");

  // ── 2. Appearance Rate ──
  lines.push("─".repeat(60));
  lines.push("2. YOUR APPEARANCE RATE");
  lines.push("─".repeat(60));
  lines.push("");
  lines.push(`Search intents tested: ${s.discoverability.intents_searched}`);
  lines.push(`Intents where you appear: ${s.discoverability.intents_present} (${Math.round(s.discoverability.presence_rate * 100)}%)`);
  lines.push("");

  for (const intent of intents) {
    const data = s.position_map[intent];
    if (data.queries.length === 0) continue;
    const icon = data.median_position !== null ? "✓" : "✗";
    lines.push(`  ${icon} ${data.label} — ${data.consistency} query variations`);
  }
  lines.push("");

  if (s.discoverability.presence_rate < 0.5) {
    lines.push(
      `⚠ You're invisible in ${Math.round((1 - s.discoverability.presence_rate) * 100)}% of the ways people might search for you.`
    );
  }
  lines.push("");

  // ── 3. Source Map ──
  lines.push("─".repeat(60));
  lines.push("3. SOURCE MAP — What Google Cites for Your Name");
  lines.push("─".repeat(60));
  lines.push("");
  lines.push(
    `Google returned ${sourceAnalysis.total_results} unique results across ${response.summary.position_map.name_search.queries.length} name searches.`
  );
  lines.push("");
  lines.push(
    padRight("Category", 28) +
    padRight("Count", 8) +
    padRight("Yours", 8) +
    padRight("Others", 8) +
    "Domains"
  );
  lines.push(
    padRight("─".repeat(26), 28) +
    padRight("─".repeat(6), 8) +
    padRight("─".repeat(6), 8) +
    padRight("─".repeat(6), 8) +
    "─".repeat(20)
  );

  for (const cat of sourceAnalysis.category_summary) {
    lines.push(
      padRight(CATEGORY_DISPLAY[cat.category], 28) +
      padRight(String(cat.count), 8) +
      padRight(String(cat.yours), 8) +
      padRight(String(cat.others), 8) +
      cat.domains.slice(0, 3).join(", ")
    );
  }
  lines.push("");

  // ── 4. Who Shows Up Instead ──
  lines.push("─".repeat(60));
  lines.push("4. WHO SHOWS UP INSTEAD OF YOU");
  lines.push("─".repeat(60));
  lines.push("");

  if (sourceAnalysis.competing_persons.length === 0) {
    lines.push("No competing persons with the same name identified.");
  } else {
    for (const cp of sourceAnalysis.competing_persons.slice(0, 4)) {
      lines.push(`${cp.name_guess}`);
      for (const src of cp.sources) {
        lines.push(`  ├── ${padRight(src.domain, 30)} ${padRight(CATEGORY_DISPLAY[src.category], 24)} #${src.position}`);
      }
      lines.push(`  └── ${cp.total_sources} sources across ${cp.category_coverage.length} categories`);
      lines.push("");
    }

    // Comparison
    lines.push("Your sources:");
    if (sourceAnalysis.your_sources.length === 0) {
      lines.push("  (none found in name searches)");
    } else {
      for (const src of sourceAnalysis.your_sources) {
        lines.push(`  ├── ${padRight(src.domain, 30)} ${CATEGORY_DISPLAY[src.category]}`);
      }
    }
    lines.push("");
  }

  // ── 5. Source Gaps ──
  lines.push("─".repeat(60));
  lines.push("5. WHAT YOU'RE MISSING (by source type)");
  lines.push("─".repeat(60));
  lines.push("");

  if (sourceAnalysis.source_gaps.length === 0) {
    lines.push("No major gaps detected — strong source diversity.");
  } else {
    for (const gap of sourceAnalysis.source_gaps) {
      const icon = STATUS_ICONS[gap.status];
      lines.push(`${icon} ${gap.label} (you: ${gap.yours}, competing: ${gap.competing})`);
      if (gap.target_domains.length > 0) {
        lines.push(`  Google is citing: ${gap.target_domains.join(", ")}`);
      }
      lines.push(`  → ${gap.recommendation}`);
      lines.push("");
    }
  }

  // ── 6. Your Google Calling Card ──
  lines.push("─".repeat(60));
  lines.push("6. YOUR GOOGLE CALLING CARD");
  lines.push("─".repeat(60));
  lines.push("");

  const snippet = s.snippet_analysis;
  if (snippet.primary_snippet) {
    lines.push(`When you appear, this is what people see:`);
    lines.push("");
    lines.push(`  "${truncate(snippet.primary_snippet, 80)}"`);
    lines.push("");
    lines.push(`  Present: ${snippet.present.length > 0 ? snippet.present.join(", ") : "nothing useful"}`);
    lines.push(`  Missing: ${snippet.missing.length > 0 ? snippet.missing.join(", ") : "nothing — looks good"}`);
  } else {
    lines.push("No snippet found — you don't appear prominently enough for Google to show your info.");
  }
  lines.push("");

  // ── 7. Narrative Control ──
  lines.push("─".repeat(60));
  lines.push("7. NARRATIVE CONTROL");
  lines.push("─".repeat(60));
  lines.push("");
  lines.push(s.narrative_control.assessment);
  lines.push("");
  lines.push(`Framing: ${s.framing_analysis.dominant_framing.replace("_", " ")}`);
  lines.push(s.framing_analysis.insight);
  lines.push("");

  // ── 8. Google Cited Domains ──
  lines.push("─".repeat(60));
  lines.push("8. DOMAINS GOOGLE CITES FOR YOUR NAME");
  lines.push("─".repeat(60));
  lines.push("");
  lines.push(
    padRight("Domain", 32) +
    padRight("Category", 24) +
    padRight("Times", 8) +
    "Best Pos"
  );
  lines.push(
    padRight("─".repeat(30), 32) +
    padRight("─".repeat(22), 24) +
    padRight("─".repeat(6), 8) +
    "─".repeat(8)
  );

  for (const d of sourceAnalysis.google_cited_domains.slice(0, 15)) {
    lines.push(
      padRight(truncate(d.domain, 30), 32) +
      padRight(CATEGORY_DISPLAY[d.category], 24) +
      padRight(`${d.appearances}x`, 8) +
      `#${d.best_position}`
    );
  }
  lines.push("");

  // ── 9. Action Plan ──
  lines.push("─".repeat(60));
  lines.push("9. ACTION PLAN");
  lines.push("─".repeat(60));
  lines.push("");

  const actions = generateActions(response, sourceAnalysis, input);
  actions.forEach((action, i) => {
    lines.push(`${i + 1}. ${action.title} [${action.impact}, ${action.effort}]`);
    lines.push(`   ${action.detail}`);
    if (action.target_domains.length > 0) {
      lines.push(`   Target: ${action.target_domains.join(", ")}`);
    }
    lines.push("");
  });

  // ── Score Breakdown ──
  lines.push("═".repeat(60));
  lines.push("SCORE BREAKDOWN");
  lines.push("═".repeat(60));

  const breakdown = calculateScoreBreakdown(response, sourceAnalysis);
  for (const item of breakdown) {
    const bar = "█".repeat(Math.round(item.score / 5)) + "░".repeat(5 - Math.round(item.score / 5));
    lines.push(`  ${padRight(item.label + ":", 28)} ${padRight(`${item.score}/${item.max}`, 8)} ${bar}`);
  }
  lines.push(`  ${"─".repeat(36)}`);
  lines.push(`  ${padRight("TOTAL:", 28)} ${score}/100`);
  lines.push("═".repeat(60));

  return lines.join("\n");
}

// ── Scoring ──

interface ScoreItem {
  label: string;
  score: number;
  max: number;
}

function calculateScoreBreakdown(
  response: AnalyzeResponse,
  sourceAnalysis: SourceAnalysis
): ScoreItem[] {
  const s = response.summary;

  // Name ownership (25 pts)
  let nameScore = 0;
  const nameSearch = s.position_map.name_search;
  if (nameSearch.median_position !== null) {
    if (nameSearch.median_position <= 3) nameScore = 20;
    else if (nameSearch.median_position <= 5) nameScore = 15;
    else if (nameSearch.median_position <= 10) nameScore = 10;
    else nameScore = 5;
  }
  if (nameSearch.consistency === "3/3") nameScore += 5;
  else if (nameSearch.consistency.startsWith("2/")) nameScore += 3;
  nameScore = Math.min(nameScore, 25);

  // Appearance rate (25 pts)
  const appearanceScore = Math.round(s.discoverability.presence_rate * 25);

  // Source diversity (25 pts)
  let diversityScore = 0;
  const yourCategories = new Set(sourceAnalysis.your_sources.map((s) => s.category));
  diversityScore += yourCategories.has("owned") ? 7 : 0;
  diversityScore += yourCategories.has("social") ? 5 : 0;
  diversityScore += yourCategories.has("authority") ? 5 : 0;
  diversityScore += yourCategories.has("press") ? 4 : 0;
  diversityScore += yourCategories.has("media") ? 4 : 0;
  diversityScore = Math.min(diversityScore, 25);

  // Snippet quality (25 pts)
  const snippet = s.snippet_analysis;
  let snippetScore = 0;
  if (snippet.primary_snippet) {
    snippetScore += snippet.present.includes("name") ? 5 : 0;
    snippetScore += snippet.present.includes("role") ? 5 : 0;
    snippetScore += snippet.present.includes("company") ? 5 : 0;
    snippetScore += snippet.present.includes("achievement") ? 5 : 0;
    snippetScore += snippet.present.includes("expertise") ? 5 : 0;
  }
  snippetScore = Math.min(snippetScore, 25);

  return [
    { label: "Name Ownership", score: nameScore, max: 25 },
    { label: "Appearance Rate", score: appearanceScore, max: 25 },
    { label: "Source Diversity", score: diversityScore, max: 25 },
    { label: "Snippet Quality", score: snippetScore, max: 25 },
  ];
}

function calculateOverallScore(
  response: AnalyzeResponse,
  sourceAnalysis: SourceAnalysis
): number {
  const breakdown = calculateScoreBreakdown(response, sourceAnalysis);
  return breakdown.reduce((sum, item) => sum + item.score, 0);
}

// ── Action generation ──

interface Action {
  title: string;
  impact: string;
  effort: string;
  detail: string;
  target_domains: string[];
}

function generateActions(
  response: AnalyzeResponse,
  sourceAnalysis: SourceAnalysis,
  input: AnalyzeRequest
): Action[] {
  const actions: Action[] = [];
  const s = response.summary;
  const gaps = sourceAnalysis.source_gaps;

  // Snippet fix — always first if snippet is weak
  if (s.snippet_analysis.missing.length >= 3) {
    actions.push({
      title: "UPDATE YOUR LINKEDIN HEADLINE & SUMMARY",
      impact: "High Impact",
      effort: "Easy",
      detail: `Your Google snippet is missing: ${s.snippet_analysis.missing.join(", ")}. LinkedIn is your #1 Google result — make it work harder by adding these to your headline.`,
      target_domains: ["linkedin.com"],
    });
  }

  // Owned site gap
  const ownedGap = gaps.find((g) => g.category === "owned");
  if (ownedGap) {
    actions.push({
      title: "CREATE A PERSONAL WEBSITE",
      impact: "High Impact",
      effort: "Medium",
      detail: `Competing persons have owned sites that rank on Google. A simple bio page with your name, role, and 2-3 articles gives Google a strong owned result.`,
      target_domains: [],
    });
  }

  // Authority gap
  const authorityGap = gaps.find((g) => g.category === "authority");
  if (authorityGap) {
    actions.push({
      title: "GET LISTED ON AUTHORITY SOURCES",
      impact: "High Impact",
      effort: "Medium",
      detail: authorityGap.recommendation,
      target_domains: authorityGap.target_domains,
    });
  }

  // Press gap
  const pressGap = gaps.find((g) => g.category === "press");
  if (pressGap) {
    actions.push({
      title: "GET PRESS COVERAGE",
      impact: "Medium Impact",
      effort: "Hard",
      detail: pressGap.recommendation,
      target_domains: pressGap.target_domains,
    });
  }

  // Media gap
  const mediaGap = gaps.find((g) => g.category === "media");
  if (mediaGap) {
    actions.push({
      title: "CREATE VIDEO/PODCAST CONTENT",
      impact: "Medium Impact",
      effort: "Medium",
      detail: mediaGap.recommendation,
      target_domains: [],
    });
  }

  // Social gap
  const socialGap = gaps.find((g) => g.category === "social");
  if (socialGap) {
    actions.push({
      title: "EXPAND SOCIAL PRESENCE",
      impact: "Medium Impact",
      effort: "Easy",
      detail: socialGap.recommendation,
      target_domains: socialGap.target_domains,
    });
  }

  // Name ambiguity — if many other people share the name
  if (sourceAnalysis.competing_persons.length >= 2) {
    actions.push({
      title: "DIFFERENTIATE FROM OTHER PEOPLE WITH YOUR NAME",
      impact: "High Impact",
      effort: "Ongoing",
      detail: `${sourceAnalysis.competing_persons.length} other people named "${input.person_name}" appear in Google. Build more sources (owned site, press, authority) to push your results above theirs.`,
      target_domains: [],
    });
  }

  return actions.slice(0, 7); // Max 7 actions
}

// ── Helpers ──

function padRight(str: string, width: number): string {
  return str.length >= width ? str : str + " ".repeat(width - str.length);
}

function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.substring(0, max - 3) + "...";
}

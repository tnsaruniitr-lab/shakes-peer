import type {
  AnalyzeRequest,
  Discoverability,
  Grade,
  IntentResult,
  IntentType,
  PresenceBreakdown,
  QueryResult,
  SnippetAnalysis,
  TopSource,
} from "./types.js";

// ── Position to grade ──

export function positionToGrade(position: number | null): Grade {
  if (position === null) return "F";
  if (position === 1) return "A+";
  if (position <= 3) return "A";
  if (position <= 5) return "B";
  if (position <= 7) return "C";
  if (position <= 10) return "D";
  return "F";
}

// ── Gap detection ──

export function detectGaps(
  positionMap: Record<IntentType, IntentResult>,
  discoverability: Discoverability,
  presence: PresenceBreakdown,
  topSources: TopSource[],
  queryResults: QueryResult[],
  input: AnalyzeRequest
): string[] {
  const gaps: string[] = [];

  // Category invisibility
  const categoryResult = positionMap.category;
  if (categoryResult && categoryResult.median_position === null && categoryResult.queries.length > 0) {
    const categoryQuery = categoryResult.queries.find((q) => q.position === null);
    gaps.push(
      `Not appearing for category searches like '${categoryResult.queries[0]?.query ?? "category"}' — invisible when people search your industry`
    );
  }

  // Contextual invisibility
  const contextualResult = positionMap.contextual;
  if (contextualResult && contextualResult.median_position === null && contextualResult.queries.length > 0) {
    gaps.push(
      "Not appearing for contextual searches — people can't find you when they search for your company's founder/leader"
    );
  }

  // No owned website
  if (presence.owned === 0) {
    gaps.push(
      "No owned website in search results — consider creating a personal site"
    );
  }

  // No media appearances
  if (presence.media_appearance === 0) {
    gaps.push(
      "No podcast or video results found — media appearances boost discoverability"
    );
  }

  // No press mentions
  if (presence.press_mention === 0) {
    gaps.push("No press coverage in search results");
  }

  // LinkedIn over-dependency
  const linkedinSource = topSources.find((s) => s.domain === "linkedin.com");
  if (
    linkedinSource &&
    presence.total > 0 &&
    linkedinSource.appearances / presence.total > 0.5
  ) {
    gaps.push(
      "Over-reliant on LinkedIn — diversify your web presence with owned sites, press, and media"
    );
  }

  // Weak average position
  if (
    discoverability.overall_median_position !== null &&
    discoverability.overall_median_position > 5
  ) {
    gaps.push(
      `Average position is ${discoverability.overall_median_position} — you're below the fold in most searches`
    );
  }

  // Low presence rate
  if (discoverability.presence_rate < 0.5 && discoverability.intents_searched >= 3) {
    gaps.push(
      `Only appearing in ${Math.round(discoverability.presence_rate * 100)}% of search intents — low overall visibility`
    );
  }

  // Name ambiguity
  const nameSearchResult = positionMap.name_search;
  if (nameSearchResult && nameSearchResult.queries.length > 0) {
    // Check the primary name search query results
    const primaryQuery = queryResults.find(
      (qr) => qr.intent === "name_search" && qr.query === input.person_name
    );
    if (primaryQuery && primaryQuery.total_results_analyzed > 0) {
      const matchRate =
        primaryQuery.person_results_count / primaryQuery.total_results_analyzed;
      if (matchRate < 0.5) {
        gaps.push(
          `Name ambiguity: only ${Math.round(matchRate * 100)}% of results for '${input.person_name}' are about you — other people share your name`
        );
      }
    }
  }

  // Inconsistent name search
  if (nameSearchResult && nameSearchResult.consistency === "1/3") {
    gaps.push(
      "Name search is inconsistent — you only appear for specific phrasings of your name"
    );
  }

  return gaps;
}

// ── Snippet analysis ──

export function analyzeSnippetCompleteness(
  queryResults: QueryResult[],
  input: AnalyzeRequest
): SnippetAnalysis {
  // Find the primary name search result's top person result
  const primaryQuery = queryResults.find(
    (qr) => qr.intent === "name_search" && qr.results.some((r) => r.is_person)
  );

  if (!primaryQuery) {
    return {
      primary_snippet: null,
      present: [],
      missing: ["name", "role", "company", "location", "achievement", "expertise"],
    };
  }

  const topPersonResult = primaryQuery.results.find((r) => r.is_person);
  if (!topPersonResult) {
    return {
      primary_snippet: null,
      present: [],
      missing: ["name", "role", "company", "location", "achievement", "expertise"],
    };
  }

  const snippet = `${topPersonResult.title} ${topPersonResult.snippet}`;
  const snippetLower = snippet.toLowerCase();
  const present: string[] = [];
  const missing: string[] = [];

  // Check name
  if (snippetLower.includes(input.person_name.toLowerCase())) {
    present.push("name");
  } else {
    missing.push("name");
  }

  // Check role
  const role = input.disambiguation?.role?.toLowerCase();
  if (role && snippetLower.includes(role)) {
    present.push("role");
  } else {
    missing.push("role");
  }

  // Check company
  const company = input.disambiguation?.company?.toLowerCase();
  if (company && snippetLower.includes(company)) {
    present.push("company");
  } else {
    missing.push("company");
  }

  // Check location
  const location = input.disambiguation?.location?.toLowerCase();
  if (location && snippetLower.includes(location)) {
    present.push("location");
  } else {
    missing.push("location");
  }

  // Check achievement keywords
  const achievementPatterns = /\b(raised|launched|founded|award|series|grew|built|scaled|exited)\b/i;
  if (achievementPatterns.test(snippet)) {
    present.push("achievement");
  } else {
    missing.push("achievement");
  }

  // Check expertise keywords
  const expertisePatterns = /\b(expert|specialist|thought leader|author|speaker|advisor|pioneer)\b/i;
  if (expertisePatterns.test(snippet)) {
    present.push("expertise");
  } else {
    missing.push("expertise");
  }

  return {
    primary_snippet: `${topPersonResult.title} — ${topPersonResult.snippet}`,
    present,
    missing,
  };
}

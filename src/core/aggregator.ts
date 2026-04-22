import type {
  AnalyzeRequest,
  Discoverability,
  FramingAnalysis,
  FramingType,
  Grade,
  IntentResult,
  IntentType,
  NarrativeControl,
  PeerInfo,
  PresenceBreakdown,
  QueryResult,
  SerpResult,
  SerpSummary,
  SnippetAnalysis,
  SourceType,
  TopSource,
} from "./types.js";
import { positionToGrade, detectGaps, analyzeSnippetCompleteness } from "./grader.js";

const INTENT_LABELS: Record<IntentType, string> = {
  name_search: "Name search",
  name_context: "Name + context",
  category: "Category visibility",
  contextual: "Contextual discovery",
};

export function aggregate(
  queryResults: QueryResult[],
  input: AnalyzeRequest
): SerpSummary {
  const positionMap = buildPositionMap(queryResults);
  const discoverability = buildDiscoverability(positionMap);
  const allPersonResults = collectPersonResults(queryResults);
  const dedupedPersonResults = deduplicateByUrl(allPersonResults);
  const presenceBreakdown = buildPresenceBreakdown(dedupedPersonResults);
  const topSources = buildTopSources(dedupedPersonResults);
  const narrativeControl = buildNarrativeControl(dedupedPersonResults, input);
  const framingAnalysis = buildFramingAnalysis(dedupedPersonResults);
  const peerLandscape = discoverPeers(queryResults, input);
  const snippetAnalysis = analyzeSnippetCompleteness(queryResults, input);
  const gaps = detectGaps(
    positionMap,
    discoverability,
    presenceBreakdown,
    topSources,
    queryResults,
    input
  );

  return {
    position_map: positionMap,
    discoverability,
    presence_breakdown: presenceBreakdown,
    top_sources: topSources,
    narrative_control: narrativeControl,
    framing_analysis: framingAnalysis,
    gaps,
    peer_landscape: peerLandscape,
    snippet_analysis: snippetAnalysis,
  };
}

// ── Position map: group queries by intent, calculate median ──

function buildPositionMap(
  queryResults: QueryResult[]
): Record<IntentType, IntentResult> {
  const intents: IntentType[] = ["name_search", "name_context", "category", "contextual"];
  const result = {} as Record<IntentType, IntentResult>;

  for (const intent of intents) {
    const intentQueries = queryResults.filter((q) => q.intent === intent);

    if (intentQueries.length === 0) {
      result[intent] = {
        intent,
        label: INTENT_LABELS[intent],
        queries: [],
        median_position: null,
        consistency: "0/0",
        range: null,
        grade: "F",
      };
      continue;
    }

    const queries = intentQueries.map((q) => ({
      query: q.query,
      position: q.person_position,
    }));

    const positions = queries
      .map((q) => q.position)
      .filter((p): p is number => p !== null);

    const median = positions.length > 0 ? calcMedian(positions) : null;
    const consistency = `${positions.length}/${intentQueries.length}`;
    const range: [number, number] | null =
      positions.length > 0
        ? [Math.min(...positions), Math.max(...positions)]
        : null;

    result[intent] = {
      intent,
      label: INTENT_LABELS[intent],
      queries,
      median_position: median,
      consistency,
      range,
      grade: positionToGrade(median),
    };
  }

  return result;
}

// ── Discoverability ──

function buildDiscoverability(
  positionMap: Record<IntentType, IntentResult>
): Discoverability {
  const intents: IntentType[] = ["name_search", "name_context", "category", "contextual"];
  const searched = intents.filter(
    (i) => positionMap[i].queries.length > 0
  ).length;
  const present = intents.filter(
    (i) => positionMap[i].median_position !== null
  ).length;

  const allMedians = intents
    .map((i) => positionMap[i].median_position)
    .filter((p): p is number => p !== null);

  const overallMedian = allMedians.length > 0 ? calcMedian(allMedians) : null;

  const scores = {} as Discoverability["scores"];
  for (const intent of intents) {
    scores[intent] = {
      rank: positionMap[intent].median_position,
      grade: positionMap[intent].grade,
    };
  }

  return {
    intents_searched: searched,
    intents_present: present,
    presence_rate: searched > 0 ? Math.round((present / searched) * 100) / 100 : 0,
    overall_median_position: overallMedian,
    scores,
  };
}

// ── Presence breakdown ──

function collectPersonResults(queryResults: QueryResult[]): SerpResult[] {
  const all: SerpResult[] = [];
  for (const qr of queryResults) {
    for (const r of qr.results) {
      if (r.is_person) {
        all.push(r);
      }
    }
  }
  return all;
}

function deduplicateByUrl(results: SerpResult[]): SerpResult[] {
  const seen = new Set<string>();
  const deduped: SerpResult[] = [];
  for (const r of results) {
    const key = r.url.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(r);
    }
  }
  return deduped;
}

function buildPresenceBreakdown(personResults: SerpResult[]): PresenceBreakdown {
  const breakdown: PresenceBreakdown = {
    owned: 0,
    social_profile: 0,
    press_mention: 0,
    media_appearance: 0,
    third_party_mention: 0,
    total: personResults.length,
  };

  for (const r of personResults) {
    switch (r.source_type) {
      case "owned":
      case "social_profile":
      case "press_mention":
      case "media_appearance":
      case "third_party_mention":
        breakdown[r.source_type]++;
        break;
      default:
        break;
    }
  }

  return breakdown;
}

// ── Top sources ──

function buildTopSources(personResults: SerpResult[]): TopSource[] {
  const domainMap = new Map<
    string,
    { appearances: number; best_position: number; source_type: SourceType }
  >();

  for (const r of personResults) {
    const existing = domainMap.get(r.domain);
    if (existing) {
      existing.appearances++;
      existing.best_position = Math.min(existing.best_position, r.position);
    } else {
      domainMap.set(r.domain, {
        appearances: 1,
        best_position: r.position,
        source_type: r.source_type,
      });
    }
  }

  return Array.from(domainMap.entries())
    .map(([domain, data]) => ({ domain, ...data }))
    .sort((a, b) => b.appearances - a.appearances || a.best_position - b.best_position);
}

// ── Narrative control ──

function buildNarrativeControl(
  personResults: SerpResult[],
  input: AnalyzeRequest
): NarrativeControl {
  const controlled = personResults.filter(
    (r) => r.source_type === "owned" || r.source_type === "social_profile"
  ).length;
  const thirdParty = personResults.filter(
    (r) =>
      r.source_type === "press_mention" ||
      r.source_type === "media_appearance" ||
      r.source_type === "third_party_mention"
  ).length;
  const total = personResults.length;
  const controlRate = total > 0 ? Math.round((controlled / total) * 100) / 100 : 0;

  let assessment: string;
  if (total === 0) {
    assessment = "No results found — no narrative to control";
  } else if (controlRate >= 0.7) {
    assessment = `Strong — you control ${Math.round(controlRate * 100)}% of results`;
  } else if (controlRate >= 0.4) {
    assessment = `Moderate — you control ${Math.round(controlRate * 100)}% of results. Third-party content shapes the rest.`;
  } else {
    assessment = `Weak — you control only ${Math.round(controlRate * 100)}% of results. Third parties define your narrative.`;
  }

  return {
    owned_or_controlled: controlled,
    third_party: thirdParty,
    control_rate: controlRate,
    assessment,
  };
}

// ── Framing analysis ──

function buildFramingAnalysis(personResults: SerpResult[]): FramingAnalysis {
  const distribution: Record<FramingType, number> = {
    role_led: 0,
    achievement_led: 0,
    expertise_led: 0,
    controversy_led: 0,
    neutral: 0,
  };

  for (const r of personResults) {
    distribution[r.framing]++;
  }

  // Find dominant
  let dominant: FramingType = "neutral";
  let maxCount = 0;
  for (const [framing, count] of Object.entries(distribution)) {
    if (count > maxCount) {
      maxCount = count;
      dominant = framing as FramingType;
    }
  }

  // Generate insight
  const insight = generateFramingInsight(distribution, dominant);

  return {
    dominant_framing: dominant,
    framing_distribution: distribution,
    insight,
  };
}

function generateFramingInsight(
  distribution: Record<FramingType, number>,
  dominant: FramingType
): string {
  const insights: string[] = [];

  if (dominant === "role_led" && distribution.achievement_led === 0) {
    insights.push(
      "Results show your title but not your achievements. Add accomplishments to your profiles and bio."
    );
  }

  if (dominant === "role_led" && distribution.expertise_led === 0) {
    insights.push(
      "No results position you as a thought leader or expert. Consider publishing articles or speaking."
    );
  }

  if (distribution.controversy_led > 0) {
    insights.push(
      `Warning: ${distribution.controversy_led} result(s) contain negative framing.`
    );
  }

  if (dominant === "neutral") {
    insights.push(
      "Results don't strongly frame you in any direction. Strengthen your profiles with clear role and achievement language."
    );
  }

  if (distribution.expertise_led > 0 && dominant !== "expertise_led") {
    insights.push(
      "Some results show expertise positioning — amplify this with more content."
    );
  }

  return insights.length > 0
    ? insights.join(" ")
    : `Results consistently frame you as '${dominant.replace("_", " ")}'. This is a coherent narrative.`;
}

// ── Peer discovery ──

function discoverPeers(
  queryResults: QueryResult[],
  input: AnalyzeRequest
): PeerInfo[] {
  const knownDomains = new Set(
    input.known_domains.map((d) => d.toLowerCase().replace(/^www\./, ""))
  );
  const knownProfiles = new Set(
    input.known_profiles.map((p) =>
      p.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "")
    )
  );

  // Count non-person domain appearances across category + contextual queries
  const domainCounts = new Map<string, { positions: number[] }>();

  for (const qr of queryResults) {
    if (qr.intent !== "category" && qr.intent !== "contextual") continue;

    for (const r of qr.results) {
      if (r.is_person) continue;
      if (knownDomains.has(r.domain)) continue;

      // Skip generic domains
      if (isGenericDomain(r.domain)) continue;

      const existing = domainCounts.get(r.domain);
      if (existing) {
        existing.positions.push(r.position);
      } else {
        domainCounts.set(r.domain, { positions: [r.position] });
      }
    }
  }

  // Filter to domains appearing 2+ times
  return Array.from(domainCounts.entries())
    .filter(([_, data]) => data.positions.length >= 2)
    .map(([domain, data]) => ({
      domain,
      appearances: data.positions.length,
      average_position:
        Math.round(
          (data.positions.reduce((a, b) => a + b, 0) / data.positions.length) * 10
        ) / 10,
    }))
    .sort((a, b) => b.appearances - a.appearances || a.average_position - b.average_position);
}

function isGenericDomain(domain: string): boolean {
  const generic = new Set([
    "google.com",
    "wikipedia.org",
    "en.wikipedia.org",
    "amazon.com",
    "facebook.com",
    "twitter.com",
    "x.com",
    "linkedin.com",
    "instagram.com",
    "youtube.com",
    "reddit.com",
    "quora.com",
    "pinterest.com",
  ]);
  return generic.has(domain);
}

// ── Helpers ──

function calcMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

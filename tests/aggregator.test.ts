import { describe, it, expect } from "vitest";
import { aggregate } from "../src/core/aggregator.js";
import type { AnalyzeRequest, QueryResult, SerpResult } from "../src/core/types.js";

function makeResult(overrides: Partial<SerpResult> = {}): SerpResult {
  return {
    position: 1,
    url: "https://example.com",
    domain: "example.com",
    title: "Example",
    snippet: "Description",
    is_person: false,
    match_confidence: 0,
    match_signals: [],
    negative_signals: [],
    match_type: "none",
    source_type: "unrelated",
    result_type: "organic",
    framing: "neutral",
    rich_snippet: { rating: null, reviews_count: null, date: null },
    ...overrides,
  };
}

function makeQueryResult(overrides: Partial<QueryResult> = {}): QueryResult {
  return {
    query: "test query",
    intent: "name_search",
    results: [],
    person_position: null,
    person_found: false,
    person_results_count: 0,
    person_results_positions: [],
    total_results_analyzed: 10,
    ...overrides,
  };
}

const baseInput: AnalyzeRequest = {
  person_name: "Jake Stein",
  disambiguation: {
    company: "TRYPS",
    role: "founder",
    location: "Dubai",
  },
  known_domains: ["jointryps.com"],
  known_profiles: ["linkedin.com/in/jakestein"],
  queries: { primary: "Jake Stein" },
  search_config: { country: "ae", language: "en" },
  peers: [],
};

describe("aggregate", () => {
  it("calculates correct presence rate", () => {
    const queryResults: QueryResult[] = [
      makeQueryResult({ intent: "name_search", person_found: true, person_position: 1 }),
      makeQueryResult({ intent: "name_search", person_found: true, person_position: 2 }),
      makeQueryResult({ intent: "name_search", person_found: false }),
      makeQueryResult({ intent: "name_context", person_found: true, person_position: 1 }),
      makeQueryResult({ intent: "name_context", person_found: true, person_position: 3 }),
      makeQueryResult({ intent: "name_context", person_found: true, person_position: 2 }),
      makeQueryResult({ intent: "category", person_found: false }),
      makeQueryResult({ intent: "category", person_found: false }),
      makeQueryResult({ intent: "category", person_found: false }),
      makeQueryResult({ intent: "contextual", person_found: true, person_position: 5 }),
      makeQueryResult({ intent: "contextual", person_found: true, person_position: 3 }),
      makeQueryResult({ intent: "contextual", person_found: false }),
    ];

    const summary = aggregate(queryResults, baseInput);

    // name_search: median of [1,2] = 1.5, present
    // name_context: median of [1,2,3] = 2, present
    // category: no positions, not present
    // contextual: median of [3,5] = 4, present
    expect(summary.discoverability.intents_present).toBe(3);
    expect(summary.discoverability.intents_searched).toBe(4);
    expect(summary.discoverability.presence_rate).toBe(0.75);
  });

  it("calculates correct grades", () => {
    const queryResults: QueryResult[] = [
      makeQueryResult({ intent: "name_search", person_found: true, person_position: 1 }),
      makeQueryResult({ intent: "name_search", person_found: true, person_position: 1 }),
      makeQueryResult({ intent: "name_search", person_found: true, person_position: 1 }),
    ];

    const summary = aggregate(queryResults, baseInput);
    expect(summary.position_map.name_search.grade).toBe("A+");
  });

  it("builds presence breakdown correctly", () => {
    const queryResults: QueryResult[] = [
      makeQueryResult({
        intent: "name_search",
        person_found: true,
        person_position: 1,
        person_results_count: 3,
        results: [
          makeResult({ is_person: true, source_type: "social_profile", url: "https://linkedin.com/in/jake", domain: "linkedin.com" }),
          makeResult({ is_person: true, source_type: "owned", url: "https://jointryps.com", domain: "jointryps.com" }),
          makeResult({ is_person: true, source_type: "press_mention", url: "https://forbes.com/jake", domain: "forbes.com" }),
        ],
      }),
    ];

    const summary = aggregate(queryResults, baseInput);
    expect(summary.presence_breakdown.social_profile).toBe(1);
    expect(summary.presence_breakdown.owned).toBe(1);
    expect(summary.presence_breakdown.press_mention).toBe(1);
    expect(summary.presence_breakdown.total).toBe(3);
  });

  it("calculates narrative control", () => {
    const queryResults: QueryResult[] = [
      makeQueryResult({
        intent: "name_search",
        person_found: true,
        person_position: 1,
        results: [
          makeResult({ is_person: true, source_type: "owned", url: "https://jointryps.com/1", domain: "jointryps.com" }),
          makeResult({ is_person: true, source_type: "social_profile", url: "https://linkedin.com/jake", domain: "linkedin.com" }),
          makeResult({ is_person: true, source_type: "press_mention", url: "https://forbes.com/jake", domain: "forbes.com" }),
        ],
      }),
    ];

    const summary = aggregate(queryResults, baseInput);
    // 2 controlled (owned + social) / 3 total = 0.67
    expect(summary.narrative_control.owned_or_controlled).toBe(2);
    expect(summary.narrative_control.third_party).toBe(1);
    expect(summary.narrative_control.control_rate).toBeCloseTo(0.67, 1);
  });

  it("detects gaps correctly", () => {
    const queryResults: QueryResult[] = [
      makeQueryResult({ intent: "name_search", person_found: true, person_position: 1 }),
      makeQueryResult({ intent: "name_search", person_found: true, person_position: 1 }),
      makeQueryResult({ intent: "name_search", person_found: true, person_position: 1 }),
      makeQueryResult({ intent: "name_context", person_found: true, person_position: 2 }),
      makeQueryResult({ intent: "name_context", person_found: true, person_position: 2 }),
      makeQueryResult({ intent: "name_context", person_found: true, person_position: 2 }),
      makeQueryResult({ intent: "category", person_found: false, query: "best travel founders Dubai" }),
      makeQueryResult({ intent: "category", person_found: false }),
      makeQueryResult({ intent: "category", person_found: false }),
      makeQueryResult({ intent: "contextual", person_found: true, person_position: 3 }),
      makeQueryResult({ intent: "contextual", person_found: true, person_position: 3 }),
      makeQueryResult({ intent: "contextual", person_found: true, person_position: 3 }),
    ];

    const summary = aggregate(queryResults, baseInput);
    // Should flag: category invisible, no owned, no media, no press
    expect(summary.gaps.some((g) => g.includes("category"))).toBe(true);
    expect(summary.gaps.some((g) => g.includes("owned website"))).toBe(true);
    expect(summary.gaps.some((g) => g.includes("podcast") || g.includes("media"))).toBe(true);
  });
});

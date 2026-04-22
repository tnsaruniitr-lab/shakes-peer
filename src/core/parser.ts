import type {
  AnalyzeRequest,
  QueryResult,
  RawSerpApiResult,
  RichSnippet,
  SerpResult,
} from "./types.js";
import type { SearchResult } from "./searcher.js";
import { matchPerson } from "./matcher.js";
import { classifySourceType, classifyFraming } from "./classifier.js";
import { extractDomain } from "../utils/patterns.js";
import { disambiguateResults } from "./disambiguator.js";

export async function parseSearchResults(
  searchResults: SearchResult[],
  input: AnalyzeRequest
): Promise<QueryResult[]> {
  // Pass 1: String-based matching
  const initial = searchResults.map((sr) => parseOneQuery(sr, input));

  // Pass 2: LLM disambiguation — passes intent so name_search gets full LLM coverage
  const disambiguated = await Promise.all(
    initial.map(async (qr) => {
      const refined = await disambiguateResults(qr.results, input, qr.intent);

      // Recalculate query-level stats after disambiguation
      const personResults = refined.filter((r) => r.is_person);
      const personPosition =
        personResults.length > 0
          ? Math.min(...personResults.map((r) => r.position))
          : null;

      return {
        ...qr,
        results: refined,
        person_position: personPosition,
        person_found: personResults.length > 0,
        person_results_count: personResults.length,
        person_results_positions: personResults.map((r) => r.position),
      };
    })
  );

  // Reclassify source types after disambiguation (is_person may have changed)
  for (const qr of disambiguated) {
    for (let i = 0; i < qr.results.length; i++) {
      const r = qr.results[i];
      qr.results[i] = {
        ...r,
        source_type: classifySourceType(r.url, r.is_person, input.known_domains),
      };
    }
  }

  return disambiguated;
}

function parseOneQuery(
  searchResult: SearchResult,
  input: AnalyzeRequest
): QueryResult {
  const { query, response } = searchResult;
  const organicResults = response.organic_results ?? [];

  const parsedResults: SerpResult[] = organicResults.map((raw) =>
    parseOneResult(raw, input, "organic")
  );

  // Find person's best position
  const personResults = parsedResults.filter((r) => r.is_person);
  const personPosition =
    personResults.length > 0
      ? Math.min(...personResults.map((r) => r.position))
      : null;

  return {
    query: query.query,
    intent: query.intent,
    results: parsedResults,
    person_position: personPosition,
    person_found: personResults.length > 0,
    person_results_count: personResults.length,
    person_results_positions: personResults.map((r) => r.position),
    total_results_analyzed: parsedResults.length,
  };
}

function parseOneResult(
  raw: RawSerpApiResult,
  input: AnalyzeRequest,
  resultType: "organic" | "ad"
): SerpResult {
  const url = raw.link;
  const title = raw.title ?? "";
  const snippet = raw.snippet ?? "";
  const domain = extractDomain(url);

  const match = matchPerson(url, title, snippet, input);
  const sourceType = classifySourceType(url, match.is_person, input.known_domains);
  const framing = classifyFraming(title, snippet);
  const richSnippet = extractRichSnippet(raw);

  return {
    position: raw.position,
    url,
    domain,
    title,
    snippet,
    is_person: match.is_person,
    match_confidence: match.match_confidence,
    match_signals: match.match_signals,
    negative_signals: match.negative_signals,
    match_type: match.match_type,
    source_type: sourceType,
    result_type: resultType,
    framing,
    rich_snippet: richSnippet,
  };
}

function extractRichSnippet(raw: RawSerpApiResult): RichSnippet {
  const topExt = raw.rich_snippet?.top?.detected_extensions;
  const bottomExt = raw.rich_snippet?.bottom?.detected_extensions;
  const ext = topExt ?? bottomExt;

  return {
    rating: ext?.rating ?? null,
    reviews_count: ext?.reviews ?? null,
    date: raw.date ?? null,
  };
}

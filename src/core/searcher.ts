import { getJson } from "serpapi";
import type {
  IntentQuery,
  RawSerpApiResponse,
  SearchConfig,
} from "./types.js";

export interface SearchResult {
  query: IntentQuery;
  response: RawSerpApiResponse;
}

export async function searchAll(
  queries: IntentQuery[],
  config: SearchConfig,
  apiKey: string
): Promise<SearchResult[]> {
  const results = await Promise.all(
    queries.map((q) => searchSingle(q, config, apiKey))
  );
  return results;
}

async function searchSingle(
  query: IntentQuery,
  config: SearchConfig,
  apiKey: string
): Promise<SearchResult> {
  const params: Record<string, string> = {
    q: query.query,
    api_key: apiKey,
    engine: "google",
    num: "30",
    gl: config.country,
    hl: config.language,
  };

  if (config.location) {
    params.location = config.location;
  }

  const response = (await getJson(params)) as RawSerpApiResponse;

  return { query, response };
}

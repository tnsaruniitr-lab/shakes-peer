import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { QueryResult, AnalyzeRequest } from "../core/types.js";

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_KEY must be set");
  }

  client = createClient(url, key);
  return client;
}

export async function saveSnapshots(
  queryResults: QueryResult[],
  input: AnalyzeRequest
): Promise<void> {
  const supabase = getSupabaseClient();

  const rows = queryResults.map((qr) => ({
    person_name: input.person_name,
    known_domain: input.known_domains[0] ?? null,
    query_text: qr.query,
    query_type: qr.intent,
    intent: qr.intent,
    results: qr.results,
    person_position: qr.person_position,
    person_found: qr.person_found,
    match_confidence: qr.person_found
      ? Math.max(...qr.results.filter((r) => r.is_person).map((r) => r.match_confidence), 0)
      : null,
    peers_found: qr.results
      .filter((r) => !r.is_person && r.source_type !== "unrelated")
      .map((r) => ({ domain: r.domain, position: r.position })),
    country: input.search_config.country,
    language: input.search_config.language,
    location: input.search_config.location ?? null,
    provider: "serpapi",
    geo_targeted: true,
  }));

  const { error } = await supabase.from("serp_snapshots").insert(rows);

  if (error) {
    console.error("Failed to save snapshots:", error.message);
    // Don't throw — persistence failure shouldn't block the response
  }
}

export async function getHistory(
  personName: string,
  days: number = 30
): Promise<{ query_text: string; person_position: number | null; snapshot_at: string }[]> {
  const supabase = getSupabaseClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("serp_snapshots")
    .select("query_text, person_position, snapshot_at")
    .eq("person_name", personName)
    .gte("snapshot_at", since)
    .order("snapshot_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch history:", error.message);
    return [];
  }

  return data ?? [];
}

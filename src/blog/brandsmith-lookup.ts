import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BlogWriterRequest } from "./types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Brandsmith lookup — auto-enrich writer request from Supabase.
//
// Pipeline position: runs BEFORE blog generation. Given the request's
// brand.domain, we fetch the matching row from the `brands` table and merge
// any populated fields into the request. Caller-supplied values always win;
// Brandsmith fills gaps.
//
// Today's `brands` table has ~8 meaningful fields per row. The richer
// `brand_profiles` table (60 columns) is currently empty across all brands,
// so we don't query it. When Brandsmith's research pipeline populates that
// table, extend this module to prefer brand_profiles over brands.
// ─────────────────────────────────────────────────────────────────────────────

export interface BrandsmithRow {
  id: number;
  name: string;
  website_url: string | null;
  category: string | null;
  icp_description: string | null;
  positioning_statement: string | null;
  tone_descriptors_json: string | null;
  product_truths_json: string | null;
  stage: string | null;
  team_size: string | null;
  current_channels: string[] | null;
  key_metric_mrr: number | null;
  key_metric_retention: number | null;
  key_metric_trial_to_paid: number | null;
}

/**
 * Find a brand by domain. Matches on hostname prefix so `answermonk.ai` finds
 * `https://answermonk.ai`, `http://www.answermonk.ai`, etc.
 *
 * Returns null on miss so callers can fall through to caller-supplied values.
 * Never throws — if Supabase is unreachable, we log and return null so the
 * writer stays operational.
 */
export async function findBrandByDomain(
  domain: string,
): Promise<BrandsmithRow | null> {
  if (!domain) return null;
  const normalized = normalizeDomainForLookup(domain);
  if (!normalized) return null;

  const client = getBrandsmithClient();
  if (!client) return null;

  const { data, error } = await client
    .from("brands")
    .select(
      "id, name, website_url, category, icp_description, positioning_statement, " +
        "tone_descriptors_json, product_truths_json, stage, team_size, " +
        "current_channels, key_metric_mrr, key_metric_retention, key_metric_trial_to_paid",
    )
    .ilike("website_url", `%${normalized}%`)
    .limit(1);

  if (error) {
    console.warn(`[brandsmith-lookup] supabase error: ${error.message}`);
    return null;
  }
  if (!data || data.length === 0) return null;
  return data[0] as unknown as BrandsmithRow;
}

// Dedicated Supabase client for Brandsmith lookups. Uses its own env vars
// (BRANDSMITH_SUPABASE_URL / BRANDSMITH_SUPABASE_KEY) so it doesn't collide
// with other Supabase projects this repo connects to for unrelated tables.
let _brandsmithClient: SupabaseClient | null = null;

function getBrandsmithClient(): SupabaseClient | null {
  if (_brandsmithClient) return _brandsmithClient;
  const url = process.env.BRANDSMITH_SUPABASE_URL;
  const key =
    process.env.BRANDSMITH_SUPABASE_KEY ??
    process.env.BRANDSMITH_SUPABASE_SERVICE_KEY;
  if (!url || !key) return null; // silently disabled — caller-supplied data will be used as-is
  _brandsmithClient = createClient(url, key);
  return _brandsmithClient;
}

function normalizeDomainForLookup(domain: string): string {
  return domain
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "")
    .trim()
    .toLowerCase();
}

/**
 * Merge Brandsmith row into a writer request. Caller fields that are already
 * populated are preserved verbatim; only empty/missing fields are filled.
 *
 * Returns a new request object; does not mutate the input.
 */
export function mergeBrandsmithIntoRequest(
  request: BlogWriterRequest,
  row: BrandsmithRow,
): BlogWriterRequest {
  const tone = parseJsonArray(row.tone_descriptors_json);
  const toneJoined = tone.length > 0 ? tone.join(", ") : undefined;
  const truths = parseJsonArray(row.product_truths_json);

  // product_description: combine positioning + ICP when both exist and the
  // caller didn't provide its own description.
  const positioning = row.positioning_statement
    ? row.positioning_statement.replace(/\s*[.!?]?\s*$/, ".")
    : null;
  const blendedDescription = [
    positioning,
    row.icp_description ? `Built for ${row.icp_description}.` : null,
  ]
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .join(" ");

  const brand = {
    ...request.brand,
    // Caller's name beats DB only if they explicitly set it; but `name` is
    // required by Zod so the caller always wins here.
    name: request.brand.name,
    // Same for domain.
    domain: request.brand.domain,
    product_description:
      isEmpty(request.brand.product_description) && blendedDescription
        ? blendedDescription
        : request.brand.product_description,
    tone_of_voice:
      isDefaultTone(request.brand.tone_of_voice) && toneJoined
        ? toneJoined
        : request.brand.tone_of_voice,
    // differentiators: brands table has no array of these yet; leave as-is.
  };

  return {
    ...request,
    brand,
    audience:
      isEmpty(request.audience) && row.icp_description
        ? row.icp_description
        : request.audience,
    article: {
      ...request.article,
      category:
        isEmpty(request.article.category) && row.category
          ? row.category
          : request.article.category,
    },
    // Optional: use product truths as first_party_data hints if caller sent none.
    // We don't auto-convert to first_party_data items because those require
    // structured finding/sample_size/methodology that brand-level truths lack.
    // Instead, surface them via `angle` when useful.
    angle:
      isEmpty(request.angle) && truths.length > 0
        ? `Ground the post in the brand's verified truths: ${truths.slice(0, 3).join("; ")}`
        : request.angle,
  };
}

function parseJsonArray(s: string | null): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function isEmpty(v: string | undefined | null): boolean {
  return v === undefined || v === null || v.trim() === "";
}

function isDefaultTone(v: string | undefined): boolean {
  return isEmpty(v) || v === "clear, expert, practical" || v === "clear, expert, practical — no fluff";
}

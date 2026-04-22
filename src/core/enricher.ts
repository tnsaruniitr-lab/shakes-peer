import { getJson } from "serpapi";
import Anthropic from "@anthropic-ai/sdk";
import type { AnalyzeRequest, Disambiguation } from "./types.js";

interface EnrichedProfile {
  company: string | null;
  role: string | null;
  location: string | null;
  industry_keywords: string[];
  headline: string | null;
}

/**
 * Auto-enriches the input by extracting disambiguation context
 * from the user's LinkedIn profile via Google's cached snippet + LLM.
 *
 * Strategy:
 *   1. SerpApi search for the exact LinkedIn profile URL
 *   2. LLM extracts company, role, location, keywords from snippet
 *   3. If both fail, continue without enrichment
 */
export async function enrichFromProfiles(
  input: AnalyzeRequest
): Promise<AnalyzeRequest> {
  const linkedinUrl = input.known_profiles.find((p) =>
    p.toLowerCase().includes("linkedin.com/in/")
  );

  if (!linkedinUrl) return input;

  // Skip if disambiguation is already fully provided
  const d = input.disambiguation;
  if (d?.company && d?.role && d?.location && d?.industry_keywords?.length) {
    return input;
  }

  const serpApiKey = process.env.SERPAPI_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!serpApiKey || !anthropicKey) {
    console.warn(
      `[enricher] Missing keys — SERPAPI_KEY: ${!!serpApiKey}, ANTHROPIC_API_KEY: ${!!anthropicKey}`
    );
    return input;
  }

  try {
    const snippet = await fetchLinkedInSnippet(input.person_name, linkedinUrl, serpApiKey);
    if (!snippet) {
      console.warn("[enricher] Could not find LinkedIn profile in Google results");
      return input;
    }

    console.log(`[enricher] Found LinkedIn snippet: "${snippet.title}" — "${snippet.snippet.substring(0, 100)}..."`);

    const enriched = await extractViaLLM(snippet, input.person_name, anthropicKey);
    if (!enriched) {
      console.warn("[enricher] LLM extraction returned nothing");
      return input;
    }

    const merged = mergeDisambiguation(d, enriched);
    console.log(
      `[enricher] Enriched: company=${merged.company}, role=${merged.role}, location=${merged.location}, keywords=${merged.industry_keywords?.join(", ")}`
    );

    return { ...input, disambiguation: merged };
  } catch (err) {
    console.warn("[enricher] Enrichment failed, continuing without:", err);
    return input;
  }
}

// ── SerpApi LinkedIn lookup ──

async function fetchLinkedInSnippet(
  personName: string,
  linkedinUrl: string,
  apiKey: string
): Promise<{ title: string; snippet: string } | null> {
  // Normalize the LinkedIn URL to extract the slug
  const slug = linkedinUrl
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");

  // Strategy 1: Search for the exact profile URL
  const response = await getJson({
    q: `"${personName}" site:linkedin.com/in/${slug.split("/").pop()}`,
    api_key: apiKey,
    engine: "google",
    num: "5",
  });

  const results = (response as any).organic_results;
  if (!results || results.length === 0) return null;

  // Try to find exact URL match first
  const profileSlug = slug.split("/").pop()?.toLowerCase() ?? "";
  const exactMatch = results.find((r: any) => {
    const resultSlug = extractLinkedInSlug(r.link);
    return resultSlug === profileSlug;
  });

  if (exactMatch) {
    return {
      title: exactMatch.title ?? "",
      snippet: exactMatch.snippet ?? "",
    };
  }

  // Strategy 2: If no exact match, take any LinkedIn /in/ result
  // (Google may redirect the URL)
  const anyLinkedin = results.find((r: any) =>
    r.link?.toLowerCase().includes("linkedin.com/in/")
  );

  if (anyLinkedin) {
    return {
      title: anyLinkedin.title ?? "",
      snippet: anyLinkedin.snippet ?? "",
    };
  }

  return null;
}

function extractLinkedInSlug(url: string): string | null {
  try {
    const match = url.match(/linkedin\.com\/in\/([^/?#]+)/i);
    return match ? match[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

// ── LLM extraction ──

async function extractViaLLM(
  profile: { title: string; snippet: string },
  personName: string,
  apiKey: string
): Promise<EnrichedProfile | null> {
  const client = new Anthropic({ apiKey });

  const prompt = `Extract structured profile information from this LinkedIn search result.

Person: ${personName}
Title: ${profile.title}
Snippet: ${profile.snippet}

Return ONLY a JSON object with these fields (use null if not found):
{
  "company": "current company name",
  "role": "current role/title (e.g. founder, CEO, director)",
  "location": "city and/or country",
  "industry_keywords": ["keyword1", "keyword2", "keyword3"],
  "headline": "their LinkedIn headline if visible"
}

Rules:
- company: the company they currently work at, not previous companies
- role: simplified role (e.g. "founder", "CEO", "director of engineering"), lowercase
- location: city, country format if available
- industry_keywords: 2-5 words describing their industry/domain (e.g. "travel", "tech", "fintech", "healthcare")
- Do NOT include the person's name in any field
- If the snippet mentions multiple companies, pick the most prominent/current one`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      company: parsed.company ?? null,
      role: parsed.role ?? null,
      location: parsed.location ?? null,
      industry_keywords: Array.isArray(parsed.industry_keywords)
        ? parsed.industry_keywords
        : [],
      headline: parsed.headline ?? null,
    };
  } catch {
    return null;
  }
}

// ── Merge helper ──

function mergeDisambiguation(
  existing: Disambiguation | undefined,
  enriched: EnrichedProfile
): Disambiguation {
  return {
    company: existing?.company || enriched.company || undefined,
    role: existing?.role || enriched.role || undefined,
    location: existing?.location || enriched.location || undefined,
    industry_keywords:
      existing?.industry_keywords?.length
        ? existing.industry_keywords
        : enriched.industry_keywords.length
          ? enriched.industry_keywords
          : undefined,
  };
}

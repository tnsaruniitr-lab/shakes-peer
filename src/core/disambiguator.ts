import Anthropic from "@anthropic-ai/sdk";
import type { AnalyzeRequest, IntentType, SerpResult } from "./types.js";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not set — LLM disambiguation unavailable");
  }
  client = new Anthropic({ apiKey });
  return client;
}

export interface DisambiguationVerdict {
  is_match: boolean;
  confidence: number;
  reasoning: string;
}

/**
 * Determines which results need LLM disambiguation.
 *
 * For name_search intent: ALL results that mention the person's name
 * get sent to LLM (not just borderlines). Because without company
 * context in the query, string matching can't distinguish same-name people.
 *
 * For other intents: only borderline results (0.2–0.7) get sent.
 */
export function needsDisambiguation(
  result: SerpResult,
  intent: IntentType
): boolean {
  // Hard matches never need LLM
  if (result.match_type === "known_domain" || result.match_type === "known_profile") {
    return false;
  }

  // No name signal at all — clearly not about this person
  if (result.match_signals.length === 0 && result.negative_signals.length === 0) {
    return false;
  }

  if (intent === "name_search") {
    // For name-only searches: send EVERYTHING with any name signal to LLM
    // because string matching alone can't distinguish same-name people
    return result.match_signals.some(
      (s) => s.startsWith("name_in_") || s === "name_parts_in_title"
    );
  }

  // For other intents: only borderline
  return result.match_confidence >= 0.2 && result.match_confidence <= 0.7;
}

export async function disambiguateResults(
  results: SerpResult[],
  input: AnalyzeRequest,
  intent: IntentType
): Promise<SerpResult[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY not set — skipping LLM disambiguation");
    return results;
  }

  const toDisambiguate = results.filter((r) => needsDisambiguation(r, intent));
  if (toDisambiguate.length === 0) return results;

  console.log(
    `[disambiguator] ${intent}: sending ${toDisambiguate.length}/${results.length} results to LLM`
  );

  const verdicts = await batchDisambiguate(toDisambiguate, input, intent);

  // Apply verdicts back to results
  return results.map((r) => {
    if (!needsDisambiguation(r, intent)) return r;

    const verdict = verdicts.get(r.url);
    if (!verdict) return r;

    return {
      ...r,
      is_person: verdict.is_match,
      match_confidence: verdict.confidence,
      match_signals: [
        ...r.match_signals,
        verdict.is_match ? "llm_confirmed" : "llm_rejected",
      ],
      match_type: r.match_type,
    };
  });
}

async function batchDisambiguate(
  results: SerpResult[],
  input: AnalyzeRequest,
  intent: IntentType
): Promise<Map<string, DisambiguationVerdict>> {
  const anthropic = getClient();

  const personContext = buildPersonContext(input);
  const resultsList = results
    .map(
      (r, i) =>
        `[${i + 1}] URL: ${r.url}\n    Title: ${r.title}\n    Snippet: ${r.snippet}`
    )
    .join("\n\n");

  const prompt = `You are disambiguating Google search results to determine if they are about a specific person.

TARGET PERSON:
${personContext}

IMPORTANT: There are MANY people with the name "${input.person_name}". Your job is to determine which results are about the TARGET PERSON described above — not any other person with the same name.

SEARCH RESULTS TO CLASSIFY:
${resultsList}

For each result, respond with ONLY a JSON array:
[
  {"index": 1, "is_match": true, "confidence": 0.9, "reasoning": "mentions McKinsey, matches target"},
  {"index": 2, "is_match": false, "confidence": 0.05, "reasoning": "this is an Australian footballer, not our target"}
]

STRICT RULES:
- is_match: true ONLY if this result is clearly about the TARGET PERSON above
- A person with the same name but different company/role/location is NOT a match
- "Jake Stein - Common Paper" is NOT the same as "Jake Stein - McKinsey" — different people
- "Jake Stein" the footballer/actor/musician/dentist is NOT the target
- A LinkedIn profile for a DIFFERENT Jake Stein is NOT a match
- A directory/scraper page (ZoomInfo, RocketReach) is a match ONLY if it shows the correct company
- If you cannot determine whether this is the target person, set is_match: false
- confidence: 0.0 to 1.0
- When in doubt, say NO — false negatives are better than false positives`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn("LLM disambiguation returned no valid JSON");
      return new Map();
    }

    const verdicts = JSON.parse(jsonMatch[0]) as Array<{
      index: number;
      is_match: boolean;
      confidence: number;
      reasoning: string;
    }>;

    const resultMap = new Map<string, DisambiguationVerdict>();
    for (const v of verdicts) {
      const result = results[v.index - 1];
      if (result) {
        resultMap.set(result.url, {
          is_match: v.is_match,
          confidence: v.confidence,
          reasoning: v.reasoning,
        });
      }
    }

    console.log(
      `[disambiguator] ${intent}: ${verdicts.filter((v) => v.is_match).length} confirmed, ${verdicts.filter((v) => !v.is_match).length} rejected`
    );

    return resultMap;
  } catch (err) {
    console.error("LLM disambiguation failed:", err);
    return new Map();
  }
}

function buildPersonContext(input: AnalyzeRequest): string {
  const lines: string[] = [`Name: ${input.person_name}`];

  if (input.disambiguation?.company) {
    lines.push(`Company: ${input.disambiguation.company}`);
  }
  if (input.disambiguation?.role) {
    lines.push(`Role: ${input.disambiguation.role}`);
  }
  if (input.disambiguation?.location) {
    lines.push(`Location: ${input.disambiguation.location}`);
  }
  if (input.disambiguation?.industry_keywords?.length) {
    lines.push(`Industry: ${input.disambiguation.industry_keywords.join(", ")}`);
  }
  if (input.known_domains.length > 0) {
    lines.push(`Known domains: ${input.known_domains.join(", ")}`);
  }
  if (input.known_profiles.length > 0) {
    lines.push(`Known profiles: ${input.known_profiles.join(", ")}`);
  }

  return lines.join("\n");
}

import type { AnalyzeRequest, IntentQuery, IntentType } from "./types.js";
import { getLocationSynonym } from "../utils/patterns.js";

export function generateQueries(input: AnalyzeRequest): IntentQuery[] {
  const queries: IntentQuery[] = [];
  const { person_name, disambiguation, queries: userQueries } = input;
  const company = disambiguation?.company;
  const role = disambiguation?.role;
  const location = disambiguation?.location;
  const keywords = disambiguation?.industry_keywords ?? [];

  // ── Name search intent (3 queries) ──
  // PURE name queries only — no company, no role, no context qualifiers.
  // This tests: "can someone find me by just my name?"
  queries.push({
    query: userQueries.primary,
    intent: "name_search",
    is_generated: false,
  });

  queries.push({
    query: `who is ${person_name}`,
    intent: "name_search",
    is_generated: true,
  });

  queries.push({
    query: `${person_name} profile`,
    intent: "name_search",
    is_generated: true,
  });

  // Deduplicate — fallbacks are also pure name queries (no company/role)
  deduplicateIntent(queries, "name_search", [
    `"${person_name}"`,
    `${person_name} about`,
  ]);

  // ── Name + context intent (3 queries) ──
  if (userQueries.variant) {
    queries.push({
      query: userQueries.variant,
      intent: "name_context",
      is_generated: false,
    });
  } else if (company) {
    queries.push({
      query: `${person_name} ${company}`,
      intent: "name_context",
      is_generated: true,
    });
  }

  if (company && role) {
    queries.push({
      query: `${person_name} ${role} ${company}`,
      intent: "name_context",
      is_generated: true,
    });
  } else if (company) {
    queries.push({
      query: `${person_name} ${company} ${location ?? ""}`.trim(),
      intent: "name_context",
      is_generated: true,
    });
  }

  if (keywords.length >= 2) {
    queries.push({
      query: `${person_name} ${keywords[0]} ${keywords[1]}`,
      intent: "name_context",
      is_generated: true,
    });
  } else if (keywords.length === 1) {
    queries.push({
      query: `${person_name} ${keywords[0]}`,
      intent: "name_context",
      is_generated: true,
    });
  }

  deduplicateIntent(queries, "name_context", [
    `${person_name} background`,
    `${person_name} career`,
  ]);

  // ── Category intent (3 queries) ──
  if (userQueries.category) {
    queries.push({
      query: userQueries.category,
      intent: "category",
      is_generated: false,
    });

    // Swap "best" → "top" or vice versa
    const swapped = swapBestTop(userQueries.category);
    if (swapped !== userQueries.category) {
      queries.push({
        query: swapped,
        intent: "category",
        is_generated: true,
      });
    }

    // Swap location synonym
    if (location) {
      const synonym = getLocationSynonym(location);
      if (synonym) {
        const locationSwapped = userQueries.category.replace(
          new RegExp(escapeRegex(location), "i"),
          synonym
        );
        if (locationSwapped !== userQueries.category) {
          queries.push({
            query: locationSwapped,
            intent: "category",
            is_generated: true,
          });
        }
      }
    }
  }

  // Build from parts if we don't have 3
  if (role && keywords.length > 0 && location) {
    queries.push({
      query: `${keywords[0]} ${role}s ${location}`,
      intent: "category",
      is_generated: true,
    });
  }

  deduplicateIntent(queries, "category", []);

  // ── Contextual intent (3 queries) ──
  if (userQueries.contextual) {
    queries.push({
      query: userQueries.contextual,
      intent: "contextual",
      is_generated: false,
    });
  }

  if (company && role) {
    queries.push({
      query: `${company} ${role}`,
      intent: "contextual",
      is_generated: true,
    });
  }

  if (company) {
    queries.push({
      query: `who founded ${company}`,
      intent: "contextual",
      is_generated: true,
    });
    queries.push({
      query: `who runs ${company}`,
      intent: "contextual",
      is_generated: true,
    });
  }

  deduplicateIntent(queries, "contextual", []);

  // ── Final: ensure exactly 3 per intent, trim extras ──
  return trimToThreePerIntent(queries);
}

function deduplicateIntent(
  queries: IntentQuery[],
  intent: IntentType,
  fallbacks: string[]
): void {
  const intentQueries = queries.filter((q) => q.intent === intent);
  const seen = new Set<string>();
  const toRemove: number[] = [];

  for (let i = 0; i < queries.length; i++) {
    if (queries[i].intent !== intent) continue;
    const normalized = queries[i].query.toLowerCase().trim();
    if (seen.has(normalized)) {
      toRemove.push(i);
    } else {
      seen.add(normalized);
    }
  }

  // Remove duplicates in reverse order
  for (let i = toRemove.length - 1; i >= 0; i--) {
    queries.splice(toRemove[i], 1);
  }

  // Backfill with fallbacks if under 3
  const currentCount = queries.filter((q) => q.intent === intent).length;
  const currentNormalized = new Set(
    queries
      .filter((q) => q.intent === intent)
      .map((q) => q.query.toLowerCase().trim())
  );

  for (
    let i = 0;
    i < fallbacks.length && queries.filter((q) => q.intent === intent).length < 3;
    i++
  ) {
    const fb = fallbacks[i].trim();
    if (fb && !currentNormalized.has(fb.toLowerCase())) {
      queries.push({ query: fb, intent, is_generated: true });
      currentNormalized.add(fb.toLowerCase());
    }
  }
}

function trimToThreePerIntent(queries: IntentQuery[]): IntentQuery[] {
  const result: IntentQuery[] = [];
  const intents: IntentType[] = ["name_search", "name_context", "category", "contextual"];

  for (const intent of intents) {
    const intentQueries = queries.filter((q) => q.intent === intent);
    // Take up to 3, prioritizing user-provided (is_generated: false) first
    const sorted = intentQueries.sort((a, b) =>
      a.is_generated === b.is_generated ? 0 : a.is_generated ? 1 : -1
    );
    result.push(...sorted.slice(0, 3));
  }

  return result;
}

function swapBestTop(query: string): string {
  if (/\bbest\b/i.test(query)) {
    return query.replace(/\bbest\b/i, "top");
  }
  if (/\btop\b/i.test(query)) {
    return query.replace(/\btop\b/i, "best");
  }
  return query;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

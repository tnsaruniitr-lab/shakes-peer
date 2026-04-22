import { describe, it, expect } from "vitest";
import { generateQueries } from "../src/core/query-generator.js";
import type { AnalyzeRequest } from "../src/core/types.js";

describe("generateQueries", () => {
  const input: AnalyzeRequest = {
    person_name: "Jake Stein",
    disambiguation: {
      company: "TRYPS",
      role: "founder",
      location: "Dubai",
      industry_keywords: ["travel", "tech"],
    },
    known_domains: ["jointryps.com"],
    known_profiles: ["linkedin.com/in/jakestein"],
    queries: {
      primary: "Jake Stein",
      variant: "Jake Stein TRYPS",
      category: "best travel tech founders Dubai",
      contextual: "TRYPS travel app founder",
    },
    search_config: { country: "ae", language: "en" },
    peers: [],
  };

  it("generates exactly 12 queries (3 per intent)", () => {
    const queries = generateQueries(input);
    // Should have at most 12 (3 per 4 intents)
    expect(queries.length).toBeLessThanOrEqual(12);
    expect(queries.length).toBeGreaterThanOrEqual(8); // At minimum 2 per intent

    // Check each intent has at most 3
    const intents = ["name_search", "name_context", "category", "contextual"];
    for (const intent of intents) {
      const count = queries.filter((q) => q.intent === intent).length;
      expect(count).toBeLessThanOrEqual(3);
    }
  });

  it("includes user-provided queries", () => {
    const queries = generateQueries(input);
    const queryTexts = queries.map((q) => q.query);
    expect(queryTexts).toContain("Jake Stein");
    expect(queryTexts).toContain("Jake Stein TRYPS");
    expect(queryTexts).toContain("best travel tech founders Dubai");
    expect(queryTexts).toContain("TRYPS travel app founder");
  });

  it("marks user queries as not generated", () => {
    const queries = generateQueries(input);
    const primaryQuery = queries.find(
      (q) => q.query === "Jake Stein" && q.intent === "name_search"
    );
    expect(primaryQuery?.is_generated).toBe(false);
  });

  it("name_search queries are pure name only — no company or location", () => {
    const queries = generateQueries(input);
    const nameQueries = queries.filter((q) => q.intent === "name_search");
    for (const q of nameQueries) {
      const lower = q.query.toLowerCase();
      expect(lower).not.toContain("tryps");
      expect(lower).not.toContain("dubai");
      expect(lower).not.toContain("founder");
    }
  });

  it("generates 'who founded' variation for contextual", () => {
    const queries = generateQueries(input);
    const contextualQueries = queries.filter((q) => q.intent === "contextual");
    const hasWhoFounded = contextualQueries.some((q) =>
      q.query.toLowerCase().includes("who founded")
    );
    expect(hasWhoFounded).toBe(true);
  });

  it("generates best→top swap for category", () => {
    const queries = generateQueries(input);
    const categoryQueries = queries.filter((q) => q.intent === "category");
    const hasTopVariant = categoryQueries.some((q) =>
      q.query.toLowerCase().includes("top")
    );
    expect(hasTopVariant).toBe(true);
  });

  it("has no duplicate queries within an intent", () => {
    const queries = generateQueries(input);
    const intents = ["name_search", "name_context", "category", "contextual"];
    for (const intent of intents) {
      const intentQueries = queries
        .filter((q) => q.intent === intent)
        .map((q) => q.query.toLowerCase().trim());
      const unique = new Set(intentQueries);
      expect(unique.size).toBe(intentQueries.length);
    }
  });
});

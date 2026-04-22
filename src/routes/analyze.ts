import { Router, Request, Response } from "express";
import { AnalyzeRequestSchema } from "../core/types.js";
import type { AnalyzeResponse } from "../core/types.js";
import { generateQueries } from "../core/query-generator.js";
import { searchAll } from "../core/searcher.js";
import { parseSearchResults } from "../core/parser.js";
import { aggregate } from "../core/aggregator.js";
import { saveSnapshots } from "../db/supabase.js";
import { enrichFromProfiles } from "../core/enricher.js";
import { analyzeSourcesForNameSearches } from "../core/source-analyzer.js";
import { generateReport } from "../core/reporter.js";

const router = Router();

router.post("/analyze", async (req: Request, res: Response): Promise<void> => {
  try {
    // Step 1: Validate input
    const parsed = AnalyzeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid input",
        details: parsed.error.flatten(),
      });
      return;
    }

    let input = parsed.data;
    const mode = (req.query.mode as string) ?? "manual";
    const format = (req.query.format as string) ?? "json";
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "SERPAPI_KEY not configured" });
      return;
    }

    // Step 1.5: Auto-enrich from LinkedIn (only in auto mode)
    if (mode === "auto") {
      console.log("[mode] Auto — enriching from LinkedIn profiles");
      input = await enrichFromProfiles(input);
    } else {
      console.log("[mode] Manual — using provided disambiguation context");
      if (!input.disambiguation?.company) {
        res.status(400).json({
          error: "Manual mode requires disambiguation.company at minimum",
          hint: "Provide disambiguation.company, or use ?mode=auto to auto-enrich from LinkedIn",
        });
        return;
      }
    }

    // Step 2: Generate query variations (4 intents × 3 variations = 12)
    const queries = generateQueries(input);

    // Step 3: Run SerpApi searches in parallel
    const searchResults = await searchAll(queries, input.search_config, apiKey);

    // Step 4: Parse all results + LLM disambiguation for borderline matches
    const queryResults = await parseSearchResults(searchResults, input);

    // Step 5: Aggregate
    const summary = aggregate(queryResults, input);

    // Step 5.5: Source analysis (for name searches)
    const sourceAnalysis = analyzeSourcesForNameSearches(queryResults, input);

    // Step 6: Persist to Supabase (non-blocking)
    saveSnapshots(queryResults, input).catch((err) =>
      console.error("Snapshot save failed:", err)
    );

    // Step 7: Build response
    const totalParsed = queryResults.reduce(
      (sum, qr) => sum + qr.total_results_analyzed,
      0
    );
    const totalMatches = queryResults.reduce(
      (sum, qr) => sum + qr.person_results_count,
      0
    );

    const response: AnalyzeResponse = {
      person: input.person_name,
      known_domains: input.known_domains,
      timestamp: new Date().toISOString(),
      metadata: {
        provider: "serpapi",
        geo_targeted: true,
        country: input.search_config.country,
        location: input.search_config.location ?? null,
        queries_executed: queries.length,
        total_results_parsed: totalParsed,
        total_person_matches: totalMatches,
      },
      queries: queryResults,
      summary,
    };

    // Return based on format
    if (format === "report") {
      const report = generateReport(response, sourceAnalysis, input);
      res.type("text/plain").send(report);
    } else if (format === "full") {
      // JSON with source analysis included
      res.json({ ...response, source_analysis: sourceAnalysis });
    } else {
      res.json(response);
    }
  } catch (err) {
    console.error("Analysis failed:", err);
    res.status(500).json({
      error: "Analysis failed",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;

import { z } from "zod";

// ── Input schemas ──

export const DisambiguationSchema = z.object({
  company: z.string().optional(),
  role: z.string().optional(),
  location: z.string().optional(),
  industry_keywords: z.array(z.string()).optional(),
});

export const QueriesSchema = z.object({
  primary: z.string().min(1, "Primary query is required"),
  variant: z.string().optional(),
  category: z.string().optional(),
  contextual: z.string().optional(),
});

export const SearchConfigSchema = z.object({
  country: z.string().default("us"),
  language: z.string().default("en"),
  location: z.string().optional(),
});

export const AnalyzeRequestSchema = z.object({
  person_name: z.string().min(1, "Person name is required"),
  disambiguation: DisambiguationSchema.optional(),
  known_domains: z.array(z.string()).default([]),
  known_profiles: z.array(z.string()).default([]),
  queries: QueriesSchema,
  search_config: SearchConfigSchema.default({}),
  peers: z.array(z.string()).default([]),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type Disambiguation = z.infer<typeof DisambiguationSchema>;
export type Queries = z.infer<typeof QueriesSchema>;
export type SearchConfig = z.infer<typeof SearchConfigSchema>;

// ── Enums ──

export type IntentType = "name_search" | "name_context" | "category" | "contextual";

export type SourceType =
  | "owned"
  | "social_profile"
  | "press_mention"
  | "media_appearance"
  | "third_party_mention"
  | "unrelated";

export type FramingType =
  | "role_led"
  | "achievement_led"
  | "expertise_led"
  | "controversy_led"
  | "neutral";

export type ResultType = "organic" | "ad" | "featured_snippet" | "knowledge_panel" | "people_also_ask";

export type Grade = "A+" | "A" | "B" | "C" | "D" | "F";

// ── Per-result types ──

export interface RichSnippet {
  rating: number | null;
  reviews_count: number | null;
  date: string | null;
}

export interface SerpResult {
  position: number;
  url: string;
  domain: string;
  title: string;
  snippet: string;
  is_person: boolean;
  match_confidence: number;
  match_signals: string[];
  negative_signals: string[];
  match_type: "known_domain" | "known_profile" | "signal_based" | "none";
  source_type: SourceType;
  result_type: ResultType;
  framing: FramingType;
  rich_snippet: RichSnippet;
}

// ── Per-query types ──

export interface QueryResult {
  query: string;
  intent: IntentType;
  results: SerpResult[];
  person_position: number | null;
  person_found: boolean;
  person_results_count: number;
  person_results_positions: number[];
  total_results_analyzed: number;
}

// ── Per-intent types ──

export interface IntentResult {
  intent: IntentType;
  label: string;
  queries: {
    query: string;
    position: number | null;
  }[];
  median_position: number | null;
  consistency: string;
  range: [number, number] | null;
  grade: Grade;
}

// ── Summary types ──

export interface PresenceBreakdown {
  owned: number;
  social_profile: number;
  press_mention: number;
  media_appearance: number;
  third_party_mention: number;
  total: number;
}

export interface TopSource {
  domain: string;
  appearances: number;
  best_position: number;
  source_type: SourceType;
}

export interface NarrativeControl {
  owned_or_controlled: number;
  third_party: number;
  control_rate: number;
  assessment: string;
}

export interface FramingAnalysis {
  dominant_framing: FramingType;
  framing_distribution: Record<FramingType, number>;
  insight: string;
}

export interface SnippetAnalysis {
  primary_snippet: string | null;
  present: string[];
  missing: string[];
}

export interface PeerInfo {
  domain: string;
  appearances: number;
  average_position: number;
}

export interface Discoverability {
  intents_searched: number;
  intents_present: number;
  presence_rate: number;
  overall_median_position: number | null;
  scores: Record<
    IntentType,
    { rank: number | null; grade: Grade }
  >;
}

export interface SerpSummary {
  position_map: Record<IntentType, IntentResult>;
  discoverability: Discoverability;
  presence_breakdown: PresenceBreakdown;
  top_sources: TopSource[];
  narrative_control: NarrativeControl;
  framing_analysis: FramingAnalysis;
  gaps: string[];
  peer_landscape: PeerInfo[];
  snippet_analysis: SnippetAnalysis;
}

// ── Full response ──

export interface AnalyzeResponse {
  person: string;
  known_domains: string[];
  timestamp: string;
  metadata: {
    provider: string;
    geo_targeted: boolean;
    country: string;
    location: string | null;
    queries_executed: number;
    total_results_parsed: number;
    total_person_matches: number;
  };
  queries: QueryResult[];
  summary: SerpSummary;
}

// ── Raw SerpApi types ──

export interface RawSerpApiResult {
  position: number;
  title: string;
  link: string;
  snippet?: string;
  displayed_link?: string;
  rich_snippet?: {
    top?: {
      detected_extensions?: {
        rating?: number;
        reviews?: number;
      };
    };
    bottom?: {
      detected_extensions?: {
        rating?: number;
        reviews?: number;
      };
    };
  };
  date?: string;
  source?: string;
}

export interface RawSerpApiResponse {
  organic_results?: RawSerpApiResult[];
  ads?: RawSerpApiResult[];
  knowledge_graph?: {
    title?: string;
    description?: string;
    source?: { link?: string };
  };
  search_information?: {
    total_results?: number;
    time_taken_displayed?: number;
  };
}

// ── Query with intent ──

export interface IntentQuery {
  query: string;
  intent: IntentType;
  is_generated: boolean;
}

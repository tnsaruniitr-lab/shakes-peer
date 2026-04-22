import type { AnalyzeRequest, QueryResult, SerpResult } from "./types.js";
import {
  SOCIAL_DOMAINS,
  NEWS_DOMAINS,
  VIDEO_DOMAINS,
  PODCAST_DOMAINS,
  AUTHORITY_DOMAINS,
  PROFESSIONAL_DIRECTORY_DOMAINS,
  SCRAPER_DIRECTORY_DOMAINS,
  ACADEMIC_DOMAINS,
  ACADEMIC_DOMAIN_PATTERNS,
  LEGAL_DOMAINS,
  REVIEW_DOMAINS,
  extractDomain,
  normalizeDomain,
} from "../utils/patterns.js";

// ── Source categories ──

export type SourceCategory =
  | "owned"
  | "social"
  | "authority"
  | "press"
  | "media"
  | "professional_directory"
  | "scraper_directory"
  | "academic"
  | "legal"
  | "review"
  | "other";

// ── Types ──

export interface ClassifiedSource {
  position: number;
  url: string;
  domain: string;
  title: string;
  snippet: string;
  category: SourceCategory;
  is_person: boolean;
  match_confidence: number;
  belongs_to: string; // "you", person name, or "unknown"
}

export interface SourceCategorySummary {
  category: SourceCategory;
  count: number;
  yours: number;
  others: number;
  positions: number[];
  domains: string[];
}

export interface CompetingPerson {
  name_guess: string; // extracted from title/snippet
  sources: {
    domain: string;
    category: SourceCategory;
    position: number;
    title: string;
  }[];
  category_coverage: SourceCategory[];
  total_sources: number;
}

export interface SourceGap {
  category: SourceCategory;
  label: string;
  status: "missing" | "weak" | "strong";
  yours: number;
  competing: number;
  recommendation: string;
  target_domains: string[]; // specific domains Google is citing
}

export interface SourceAnalysis {
  total_results: number;
  classified_results: ClassifiedSource[];
  category_summary: SourceCategorySummary[];
  competing_persons: CompetingPerson[];
  source_gaps: SourceGap[];
  your_sources: ClassifiedSource[];
  google_cited_domains: { domain: string; category: SourceCategory; appearances: number; best_position: number }[];
}

// ── Main function ──

export function analyzeSourcesForNameSearches(
  queryResults: QueryResult[],
  input: AnalyzeRequest
): SourceAnalysis {
  // Only analyze name_search intent queries
  const nameQueries = queryResults.filter((qr) => qr.intent === "name_search");

  // Classify every result across all name queries
  const allClassified: ClassifiedSource[] = [];
  for (const qr of nameQueries) {
    for (const r of qr.results) {
      allClassified.push(classifySource(r, input));
    }
  }

  // Deduplicate by URL
  const deduped = deduplicateByUrl(allClassified);

  // Build category summary
  const categorySummary = buildCategorySummary(deduped);

  // Identify competing persons
  const competingPersons = identifyCompetingPersons(deduped, input);

  // Your sources
  const yourSources = deduped.filter((s) => s.belongs_to === "you");

  // Google cited domains (all domains Google is ranking, regardless of person)
  const citedDomains = buildCitedDomains(allClassified);

  // Source gaps
  const sourceGaps = identifySourceGaps(categorySummary, competingPersons, deduped, input);

  return {
    total_results: deduped.length,
    classified_results: deduped,
    category_summary: categorySummary,
    competing_persons: competingPersons,
    source_gaps: sourceGaps,
    your_sources: yourSources,
    google_cited_domains: citedDomains,
  };
}

// ── Classification ──

function classifySource(result: SerpResult, input: AnalyzeRequest): ClassifiedSource {
  const domain = result.domain;
  const category = classifyDomainCategory(domain, result.url, input.known_domains);
  const belongsTo = determineBelongsTo(result, input);

  return {
    position: result.position,
    url: result.url,
    domain,
    title: result.title,
    snippet: result.snippet,
    category,
    is_person: result.is_person,
    match_confidence: result.match_confidence,
    belongs_to: belongsTo,
  };
}

function classifyDomainCategory(
  domain: string,
  url: string,
  knownDomains: string[]
): SourceCategory {
  const normalized = normalizeDomain(domain);

  // Check owned first
  for (const d of knownDomains) {
    if (normalized === normalizeDomain(d)) return "owned";
  }

  // Check each category
  if (SOCIAL_DOMAINS.has(normalized)) return "social";
  if (AUTHORITY_DOMAINS.has(normalized)) return "authority";
  if (NEWS_DOMAINS.has(normalized)) return "press";
  if (VIDEO_DOMAINS.has(normalized) || PODCAST_DOMAINS.has(normalized)) return "media";
  if (PROFESSIONAL_DIRECTORY_DOMAINS.has(normalized)) return "professional_directory";
  if (SCRAPER_DIRECTORY_DOMAINS.has(normalized)) return "scraper_directory";
  if (ACADEMIC_DOMAINS.has(normalized)) return "academic";
  if (LEGAL_DOMAINS.has(normalized)) return "legal";
  if (REVIEW_DOMAINS.has(normalized)) return "review";

  // Check academic patterns (*.edu, *.ac.uk, etc.)
  if (ACADEMIC_DOMAIN_PATTERNS.some((p) => p.test(normalized))) return "academic";

  return "other";
}

function determineBelongsTo(result: SerpResult, input: AnalyzeRequest): string {
  if (result.is_person) return "you";

  // Try to extract a person name from the title for competing Jake Steins
  const personName = input.person_name.toLowerCase();
  const titleLower = result.title.toLowerCase();

  if (titleLower.includes(personName)) {
    // Title has the same name but it's not our person — it's a competing person
    // Try to extract a differentiator (company, role)
    const differentiator = extractDifferentiator(result.title, input.person_name);
    return differentiator ? `${input.person_name} (${differentiator})` : `other ${input.person_name}`;
  }

  return "unknown";
}

function extractDifferentiator(title: string, personName: string): string | null {
  // Remove the person name and common separators to find what's left
  const cleaned = title
    .replace(new RegExp(personName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "")
    .replace(/^[\s\-–—|·:]+/, "")
    .replace(/[\s\-–—|·:]+$/, "")
    .trim();

  if (cleaned.length > 0 && cleaned.length < 60) {
    return cleaned;
  }
  return null;
}

// ── Aggregation helpers ──

function deduplicateByUrl(results: ClassifiedSource[]): ClassifiedSource[] {
  const seen = new Set<string>();
  const deduped: ClassifiedSource[] = [];
  for (const r of results) {
    const key = r.url.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(r);
    }
  }
  return deduped;
}

function buildCategorySummary(results: ClassifiedSource[]): SourceCategorySummary[] {
  const categories: SourceCategory[] = [
    "owned", "social", "authority", "press", "media",
    "professional_directory", "scraper_directory", "academic", "legal", "review", "other",
  ];

  return categories.map((cat) => {
    const matching = results.filter((r) => r.category === cat);
    return {
      category: cat,
      count: matching.length,
      yours: matching.filter((r) => r.belongs_to === "you").length,
      others: matching.filter((r) => r.belongs_to !== "you").length,
      positions: matching.map((r) => r.position).sort((a, b) => a - b),
      domains: [...new Set(matching.map((r) => r.domain))],
    };
  }).filter((s) => s.count > 0); // Only return categories that have results
}

function buildCitedDomains(
  results: ClassifiedSource[]
): { domain: string; category: SourceCategory; appearances: number; best_position: number }[] {
  const domainMap = new Map<string, { category: SourceCategory; appearances: number; best_position: number }>();

  for (const r of results) {
    const existing = domainMap.get(r.domain);
    if (existing) {
      existing.appearances++;
      existing.best_position = Math.min(existing.best_position, r.position);
    } else {
      domainMap.set(r.domain, {
        category: r.category,
        appearances: 1,
        best_position: r.position,
      });
    }
  }

  return Array.from(domainMap.entries())
    .map(([domain, data]) => ({ domain, ...data }))
    .sort((a, b) => b.appearances - a.appearances || a.best_position - b.best_position);
}

// ── Competing persons ──

function identifyCompetingPersons(
  results: ClassifiedSource[],
  input: AnalyzeRequest
): CompetingPerson[] {
  // Group non-you results by belongs_to
  const groups = new Map<string, ClassifiedSource[]>();

  for (const r of results) {
    if (r.belongs_to === "you" || r.belongs_to === "unknown") continue;

    const key = r.belongs_to;
    const existing = groups.get(key);
    if (existing) {
      existing.push(r);
    } else {
      groups.set(key, [r]);
    }
  }

  return Array.from(groups.entries())
    .map(([name, sources]) => ({
      name_guess: name,
      sources: sources.map((s) => ({
        domain: s.domain,
        category: s.category,
        position: s.position,
        title: s.title,
      })),
      category_coverage: [...new Set(sources.map((s) => s.category))],
      total_sources: sources.length,
    }))
    .sort((a, b) => b.total_sources - a.total_sources);
}

// ── Source gap identification ──

const CATEGORY_LABELS: Record<SourceCategory, string> = {
  owned: "Owned Website",
  social: "Social Profiles",
  authority: "Authority Sources",
  press: "Press & News",
  media: "Media (Video/Podcast)",
  professional_directory: "Professional Directories",
  scraper_directory: "Scraper Directories",
  academic: "Academic",
  legal: "Legal",
  review: "Review Sites",
  other: "Other",
};

function identifySourceGaps(
  categorySummary: SourceCategorySummary[],
  competingPersons: CompetingPerson[],
  allResults: ClassifiedSource[],
  input: AnalyzeRequest
): SourceGap[] {
  const gaps: SourceGap[] = [];

  // Get what competing persons have across all categories
  const competingCategories = new Set<SourceCategory>();
  for (const cp of competingPersons) {
    for (const cat of cp.category_coverage) {
      competingCategories.add(cat);
    }
  }

  const checkCategories: { category: SourceCategory; importance: "high" | "medium" | "low" }[] = [
    { category: "owned", importance: "high" },
    { category: "social", importance: "high" },
    { category: "authority", importance: "high" },
    { category: "press", importance: "medium" },
    { category: "media", importance: "medium" },
    { category: "professional_directory", importance: "low" },
  ];

  for (const { category, importance } of checkCategories) {
    const summary = categorySummary.find((s) => s.category === category);
    const yours = summary?.yours ?? 0;
    const total = summary?.count ?? 0;
    const others = summary?.others ?? 0;

    // Find domains Google is citing in this category
    const targetDomains = allResults
      .filter((r) => r.category === category && r.belongs_to !== "you")
      .map((r) => r.domain);
    const uniqueTargetDomains = [...new Set(targetDomains)];

    let status: "missing" | "weak" | "strong";
    let recommendation: string;

    if (yours === 0) {
      status = "missing";
      recommendation = getRecommendation(category, uniqueTargetDomains, competingPersons);
    } else if (yours === 1 && others >= 2) {
      status = "weak";
      recommendation = getWeakRecommendation(category, uniqueTargetDomains);
    } else {
      status = "strong";
      recommendation = "";
    }

    if (status !== "strong") {
      gaps.push({
        category,
        label: CATEGORY_LABELS[category],
        status,
        yours,
        competing: others,
        recommendation,
        target_domains: uniqueTargetDomains.slice(0, 5),
      });
    }
  }

  return gaps;
}

function getRecommendation(
  category: SourceCategory,
  targetDomains: string[],
  competingPersons: CompetingPerson[]
): string {
  const domainList = targetDomains.slice(0, 3).join(", ");

  switch (category) {
    case "owned":
      return `Create a personal website or bio page. Competing persons have owned sites. Google ranks these highly for name searches.`;
    case "social":
      return `Expand social presence. Google is citing: ${domainList}. Ensure profiles on these platforms have consistent name, role, and company.`;
    case "authority":
      return `Get listed on authority sources. Google is citing: ${domainList}. Create a Crunchbase profile, contribute to Wikipedia-notable projects, or get listed in industry databases.`;
    case "press":
      return `Get press coverage. Google is citing: ${domainList}. Pitch a guest article, get quoted in an industry piece, or do an interview.`;
    case "media":
      return `Create video/podcast content. No competing persons have media either — opportunity to stand out. Start with a YouTube video or podcast guest appearance.`;
    case "professional_directory":
      return `Get listed on professional directories. Google is citing: ${domainList}. Ensure your profiles are complete and up-to-date.`;
    default:
      return `Build presence in ${CATEGORY_LABELS[category]} sources.`;
  }
}

function getWeakRecommendation(category: SourceCategory, targetDomains: string[]): string {
  const domainList = targetDomains.slice(0, 3).join(", ");
  return `You have 1 result here but competitors have more. Google also cites: ${domainList}. Strengthen by adding more ${CATEGORY_LABELS[category].toLowerCase()} sources.`;
}

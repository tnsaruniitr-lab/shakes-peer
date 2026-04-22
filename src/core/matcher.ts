import type { AnalyzeRequest } from "./types.js";
import { normalizeDomain, normalizeProfileUrl } from "../utils/patterns.js";

export interface MatchResult {
  is_person: boolean;
  match_confidence: number;
  match_signals: string[];
  negative_signals: string[];
  match_type: "known_domain" | "known_profile" | "signal_based" | "none";
}

// ── Negative signal patterns ──
// Roles/occupations that indicate a DIFFERENT person
const CONFLICTING_ROLE_PATTERNS = [
  /\b(footballer|athlete|cricket|rugby|basketball|baseball|hockey|tennis|swimmer|boxer|wrestler)\b/i,
  /\b(actor|actress|director|producer|screenwriter|filmmaker)\b/i,
  /\b(dentist|dds|physician|surgeon|md|doctor|nurse|therapist|psychiatrist)\b/i,
  /\b(attorney|lawyer|judge|paralegal|solicitor|barrister)\b/i,
  /\b(professor|doctoral student|phd candidate|postdoc|lecturer)\b/i,
  /\b(musician|guitarist|drummer|singer|songwriter|bandcamp)\b/i,
  /\b(chef|baker|photographer|artist|painter|sculptor)\b/i,
  /\b(pastor|rabbi|priest|reverend|bishop)\b/i,
  /\b(realtor|real estate agent)\b/i,
];

// Locations that conflict with known location
const KNOWN_LOCATION_ALIASES: Record<string, string[]> = {
  "new york": ["ny", "nyc", "manhattan", "brooklyn"],
  "san francisco": ["sf", "bay area"],
  dubai: ["uae", "united arab emirates"],
  london: ["uk", "united kingdom"],
  // Add more as needed
};

export function matchPerson(
  url: string,
  title: string,
  snippet: string,
  input: AnalyzeRequest
): MatchResult {
  const positiveSignals: string[] = [];
  const negativeSignals: string[] = [];
  let confidence = 0;

  const normalizedUrl = normalizeProfileUrl(url);
  const domain = normalizeDomain(extractDomainFromUrl(url));

  // ── Hard matches ──

  for (const d of input.known_domains) {
    if (domain === normalizeDomain(d)) {
      return {
        is_person: true,
        match_confidence: 1.0,
        match_signals: ["known_domain"],
        negative_signals: [],
        match_type: "known_domain",
      };
    }
  }

  for (const profile of input.known_profiles) {
    const normalizedProfile = normalizeProfileUrl(profile);
    if (isExactProfileMatch(normalizedUrl, normalizedProfile)) {
      return {
        is_person: true,
        match_confidence: 1.0,
        match_signals: ["known_profile"],
        negative_signals: [],
        match_type: "known_profile",
      };
    }
  }

  // ── Positive signals ──

  const personName = input.person_name.toLowerCase();
  const titleLower = title.toLowerCase();
  const snippetLower = snippet.toLowerCase();
  const combined = `${titleLower} ${snippetLower}`;

  // Name in title
  if (titleLower.includes(personName)) {
    positiveSignals.push("name_in_title");
    confidence += 0.3;
  }

  // Name in snippet
  if (snippetLower.includes(personName)) {
    positiveSignals.push("name_in_snippet");
    confidence += 0.2;
  }

  // Name parts
  const nameParts = personName.split(/\s+/);
  if (nameParts.length >= 2 && !positiveSignals.includes("name_in_title")) {
    const lastName = nameParts[nameParts.length - 1];
    const firstName = nameParts[0];
    if (titleLower.includes(firstName) && titleLower.includes(lastName)) {
      positiveSignals.push("name_parts_in_title");
      confidence += 0.2;
    }
  }

  // Company match
  const company = input.disambiguation?.company?.toLowerCase();
  if (company && positiveSignals.length > 0 && combined.includes(company)) {
    positiveSignals.push("company_match");
    confidence += 0.3;
  }

  // Role match
  const role = input.disambiguation?.role?.toLowerCase();
  if (role && positiveSignals.length > 0 && combined.includes(role)) {
    positiveSignals.push("role_match");
    confidence += 0.15;
  }

  // Location match
  const location = input.disambiguation?.location?.toLowerCase();
  if (location && positiveSignals.length > 0) {
    const locationAliases = [location, ...(KNOWN_LOCATION_ALIASES[location] ?? [])];
    if (locationAliases.some((loc) => combined.includes(loc))) {
      positiveSignals.push("location_match");
      confidence += 0.1;
    }
  }

  // Industry keywords
  const keywords = input.disambiguation?.industry_keywords ?? [];
  if (positiveSignals.length > 0) {
    for (const kw of keywords) {
      if (combined.includes(kw.toLowerCase())) {
        positiveSignals.push("industry_match");
        confidence += 0.1;
        break;
      }
    }
  }

  // ── Negative signals (only apply if name was found) ──

  if (positiveSignals.length > 0) {
    // Conflicting role — snippet describes a clearly different profession
    if (role) {
      for (const pattern of CONFLICTING_ROLE_PATTERNS) {
        if (pattern.test(combined)) {
          // Make sure the conflicting role isn't actually OUR person's role
          if (!pattern.test(role)) {
            negativeSignals.push(`conflicting_role: ${combined.match(pattern)?.[0]}`);
            confidence -= 0.25;
            break;
          }
        }
      }
    }

    // Conflicting company — a different company is prominently mentioned
    if (company && !combined.includes(company)) {
      // Check if there's a different company/org mentioned prominently in the title
      // Pattern: "Jake Stein - [Something Else]" or "Jake Stein | [Something Else]"
      const titleAfterName = titleLower
        .replace(personName, "")
        .replace(/^[\s\-–—|·:@]+/, "")
        .trim();
      if (titleAfterName.length > 2 && titleAfterName.length < 50) {
        negativeSignals.push(`different_org_in_title: ${titleAfterName}`);
        confidence -= 0.15;
      }
    }

    // Conflicting location — a clearly different location mentioned
    if (location) {
      const locationAliases = new Set([
        location,
        ...(KNOWN_LOCATION_ALIASES[location] ?? []),
      ]);
      const otherLocations = extractLocationsFromText(combined);
      for (const otherLoc of otherLocations) {
        if (!locationAliases.has(otherLoc.toLowerCase())) {
          // Only penalize if our location is NOT mentioned but another one IS
          if (!locationAliases.has(otherLoc.toLowerCase()) && !combined.includes(location)) {
            negativeSignals.push(`different_location: ${otherLoc}`);
            confidence -= 0.1;
            break;
          }
        }
      }
    }

    // Scraper/directory result with no company match — low value
    if (isScraperDomain(domain) && !positiveSignals.includes("company_match")) {
      negativeSignals.push("scraper_without_company_match");
      confidence -= 0.1;
    }
  }

  // ── Final ──

  confidence = Math.max(0, Math.min(confidence, 1.0));

  return {
    is_person: confidence >= 0.6, // Raised from 0.5
    match_confidence: Math.round(confidence * 100) / 100,
    match_signals: positiveSignals,
    negative_signals: negativeSignals,
    match_type: positiveSignals.length > 0 ? "signal_based" : "none",
  };
}

// ── Helpers ──

function extractDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function isExactProfileMatch(resultUrl: string, knownProfile: string): boolean {
  const resultPath = extractProfilePath(resultUrl);
  const knownPath = extractProfilePath(knownProfile);
  if (!resultPath || !knownPath) return false;
  return resultPath === knownPath;
}

function extractProfilePath(url: string): string | null {
  const cleaned = url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\?.*$/, "")
    .replace(/\/$/, "");

  const linkedinMatch = cleaned.match(/^(linkedin\.com\/in\/[^/]+)/);
  if (linkedinMatch) return linkedinMatch[1];
  return cleaned;
}

function isScraperDomain(domain: string): boolean {
  const scrapers = new Set([
    "zoominfo.com", "apollo.io", "rocketreach.co", "lusha.com",
    "signalhire.com", "idcrawl.com", "spokeo.com", "beenverified.com",
    "truepeoplesearch.com", "peekyou.com", "radaris.com",
  ]);
  return scrapers.has(domain);
}

function extractLocationsFromText(text: string): string[] {
  // Simple location extraction — known city/country patterns
  const locationPatterns = [
    /\b(Palatine|Columbus|Charlotte|Philadelphia|Austin|Seattle|Chicago|Boston|Atlanta|Portland)\b/i,
    /\b(Ohio|Illinois|Texas|California|Florida|Virginia|Colorado|Arizona)\b/i,
    /\b(Australia|UK|India|Canada|Germany|France|Singapore|Japan|Israel)\b/i,
    /\b(Dubai|London|Berlin|Paris|Tokyo|Sydney|Melbourne|Toronto|Mumbai)\b/i,
  ];

  const found: string[] = [];
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) found.push(match[1]);
  }
  return found;
}

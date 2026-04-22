import type { SourceType, FramingType } from "./types.js";
import {
  SOCIAL_DOMAINS,
  NEWS_DOMAINS,
  VIDEO_DOMAINS,
  PODCAST_DOMAINS,
  REVIEW_DOMAINS,
  DIRECTORY_DOMAINS,
  FRAMING_PATTERNS,
  extractDomain,
} from "../utils/patterns.js";

export function classifySourceType(
  url: string,
  isPerson: boolean,
  knownDomains: string[]
): SourceType {
  if (!isPerson) return "unrelated";

  const domain = extractDomain(url);

  // Check if it's an owned domain
  for (const d of knownDomains) {
    const normalizedKnown = d.toLowerCase().replace(/^www\./, "");
    if (domain === normalizedKnown) {
      return "owned";
    }
  }

  // Check social profiles
  if (SOCIAL_DOMAINS.has(domain)) return "social_profile";

  // Check media (video + podcast)
  if (VIDEO_DOMAINS.has(domain)) return "media_appearance";
  if (PODCAST_DOMAINS.has(domain)) return "media_appearance";

  // Check news/press
  if (NEWS_DOMAINS.has(domain)) return "press_mention";

  // Check if it's a known directory (Crunchbase, etc.)
  if (DIRECTORY_DOMAINS.has(domain)) return "third_party_mention";

  // Check review sites
  if (REVIEW_DOMAINS.has(domain)) return "third_party_mention";

  // Default: if the person is mentioned on an unknown domain, it's a third-party mention
  return "third_party_mention";
}

export function classifyFraming(title: string, snippet: string): FramingType {
  const combined = `${title} ${snippet}`;

  // Check in priority order: controversy first (most important to flag)
  if (matchesAny(combined, FRAMING_PATTERNS.controversy_led)) {
    return "controversy_led";
  }

  if (matchesAny(combined, FRAMING_PATTERNS.achievement_led)) {
    return "achievement_led";
  }

  if (matchesAny(combined, FRAMING_PATTERNS.expertise_led)) {
    return "expertise_led";
  }

  if (matchesAny(combined, FRAMING_PATTERNS.role_led)) {
    return "role_led";
  }

  return "neutral";
}

function matchesAny(text: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

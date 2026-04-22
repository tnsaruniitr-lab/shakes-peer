// ── Domain classification lists ──

export const SOCIAL_DOMAINS = new Set([
  "linkedin.com",
  "twitter.com",
  "x.com",
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "threads.net",
  "medium.com",
  "substack.com",
  "github.com",
  "about.me",
  "linktr.ee",
]);

export const NEWS_DOMAINS = new Set([
  "bbc.com",
  "bbc.co.uk",
  "cnn.com",
  "reuters.com",
  "bloomberg.com",
  "forbes.com",
  "inc.com",
  "entrepreneur.com",
  "techcrunch.com",
  "wired.com",
  "theverge.com",
  "arstechnica.com",
  "businessinsider.com",
  "cnbc.com",
  "ft.com",
  "wsj.com",
  "nytimes.com",
  "theguardian.com",
  "arabianbusiness.com",
  "gulfnews.com",
  "khaleejtimes.com",
  "thenationalnews.com",
  "zawya.com",
  "arabnews.com",
  "economictimes.indiatimes.com",
  "livemint.com",
  "moneycontrol.com",
  "hindustantimes.com",
  "ndtv.com",
  "timesofindia.indiatimes.com",
]);

export const VIDEO_DOMAINS = new Set([
  "youtube.com",
  "youtu.be",
  "vimeo.com",
  "dailymotion.com",
  "twitch.tv",
]);

export const PODCAST_DOMAINS = new Set([
  "podcasts.apple.com",
  "open.spotify.com",
  "podcasts.google.com",
  "anchor.fm",
  "podbean.com",
  "buzzsprout.com",
  "transistor.fm",
  "simplecast.com",
]);

export const REVIEW_DOMAINS = new Set([
  "trustpilot.com",
  "g2.com",
  "capterra.com",
  "glassdoor.com",
  "yelp.com",
  "tripadvisor.com",
]);

// Authority domains — high domain authority, editorial/curated content
export const AUTHORITY_DOMAINS = new Set([
  "en.wikipedia.org",
  "wikipedia.org",
  "crunchbase.com",
  "pitchbook.com",
  "bloomberg.com",
  "worldathletics.org",
  "imdb.com",
  "ted.com",
  "wikidata.org",
  "britannica.com",
]);

// Professional directories — curated/semi-curated listings
export const PROFESSIONAL_DIRECTORY_DOMAINS = new Set([
  "wellfound.com",
  "angellist.com",
  "f6s.com",
  "clutch.co",
  "toptal.com",
  "upwork.com",
  "fiverr.com",
  "vault.com",
  "comparably.com",
]);

// Scraper/aggregator directories — auto-generated, low value
export const SCRAPER_DIRECTORY_DOMAINS = new Set([
  "zoominfo.com",
  "apollo.io",
  "rocketreach.co",
  "lusha.com",
  "signalhire.com",
  "idcrawl.com",
  "spokeo.com",
  "whitepages.com",
  "yellowpages.com",
  "beenverified.com",
  "truepeoplesearch.com",
  "thatsmyname.com",
  "peekyou.com",
  "pipl.com",
  "radaris.com",
  "fastpeoplesearch.com",
  "peoplelooker.com",
]);

// Academic domains
export const ACADEMIC_DOMAINS = new Set([
  "scholar.google.com",
  "researchgate.net",
  "academia.edu",
  "arxiv.org",
  "pubmed.ncbi.nlm.nih.gov",
  "orcid.org",
  "semanticscholar.org",
]);

// Academic domain patterns (universities etc.)
export const ACADEMIC_DOMAIN_PATTERNS = [
  /\.edu$/,
  /\.ac\.[a-z]{2}$/,
  /university|college|institute/i,
];

// Legal domains
export const LEGAL_DOMAINS = new Set([
  "courtlistener.com",
  "pacer.gov",
  "law.com",
  "justia.com",
  "casetext.com",
  "sec.gov",
  "opencorporates.com",
]);

// Legacy alias for backward compat
export const DIRECTORY_DOMAINS = new Set([
  ...PROFESSIONAL_DIRECTORY_DOMAINS,
  ...SCRAPER_DIRECTORY_DOMAINS,
]);

// ── Framing detection patterns ──

export const FRAMING_PATTERNS = {
  role_led: [
    /\b(founder|co-founder|ceo|cto|coo|cfo|president|director|vp|head of|managing partner|partner|chairman)\b/i,
    /\b(chief .+ officer)\b/i,
  ],
  achievement_led: [
    /\b(raised|raises|funding|series [a-e]|acquired|acquisition|ipo|launch|launched|launches)\b/i,
    /\b(award|awarded|winner|won|named|recognized|honored|featured)\b/i,
    /\b(\$[\d,.]+[mbk]?|million|billion)\b/i,
  ],
  expertise_led: [
    /\b(expert|thought leader|speaker|keynote|author|advisor|consultant|professor|researcher)\b/i,
    /\b(published|writes about|specializes in|known for)\b/i,
  ],
  controversy_led: [
    /\b(lawsuit|sued|controversy|scandal|accused|fired|terminated|fraud|investigation|arrested)\b/i,
    /\b(allegation|complaint|violation|misconduct)\b/i,
  ],
} as const;

// ── Snippet completeness fields ──

export const SNIPPET_FIELDS = [
  "name",
  "role",
  "company",
  "location",
  "achievement",
  "expertise",
] as const;

// ── Location synonyms for query variation ──

export const LOCATION_SYNONYMS: Record<string, string[]> = {
  dubai: ["UAE", "United Arab Emirates"],
  uae: ["Dubai", "United Arab Emirates"],
  "united arab emirates": ["Dubai", "UAE"],
  london: ["UK", "United Kingdom"],
  uk: ["London", "United Kingdom"],
  "new york": ["NYC", "US"],
  nyc: ["New York", "US"],
  "san francisco": ["SF", "Bay Area", "US"],
  sf: ["San Francisco", "Bay Area"],
  singapore: ["SG"],
  mumbai: ["India"],
  delhi: ["India"],
  bangalore: ["India", "Bengaluru"],
};

export function getLocationSynonym(location: string): string | null {
  const lower = location.toLowerCase();
  const synonyms = LOCATION_SYNONYMS[lower];
  if (synonyms && synonyms.length > 0) {
    return synonyms[0];
  }
  return null;
}

// ── Domain extraction ──

export function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function normalizeDomain(domain: string): string {
  return domain.toLowerCase().replace(/^www\./, "").replace(/\/$/, "");
}

export function normalizeProfileUrl(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

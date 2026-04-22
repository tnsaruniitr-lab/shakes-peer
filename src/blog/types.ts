import { z } from "zod";

export const BlogSourceSchema = z.object({
  id: z.string().min(1, "Source id is required"),
  title: z.string().min(1, "Source title is required"),
  url: z.string().url("Source URL must be valid"),
  publisher: z.string().optional(),
  author: z.string().optional(),
  published_at: z.string().optional(),
  excerpt: z.string().min(1, "Source excerpt is required"),
  // NEW: Authority tier for Google Helpful Content System compliance.
  // - primary: arXiv, OpenAI docs, Google Search Central, W3C, gov/edu, peer-reviewed
  // - industry: Gartner, Forrester, G2, Capterra, Statista, major analyst reports
  // - editorial: blogs, marketing posts, news articles (default, lowest trust)
  authority_tier: z
    .enum(["primary", "industry", "editorial"])
    .default("editorial"),
});

export const BlogBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  domain: z.string().min(1, "Brand domain is required"),
  product_name: z.string().optional(),
  product_description: z.string().min(1, "Product description is required"),
  audience: z.string().optional(),
  tone_of_voice: z.string().default("clear, expert, practical"),
  differentiators: z.array(z.string()).default([]),
  founder: z.string().optional(),
  twitter_handle: z.string().optional(),
});

// Author entity — REQUIRED for Helpful Content System E-E-A-T.
// Must include sameAs with LinkedIn URL. Writer will fail if bio/linkedin missing.
export const BlogAuthorSchema = z.object({
  name: z.string().min(1, "Author name is required"),
  title: z.string().min(1, "Author title/role is required"),
  bio: z.string().min(30, "Author bio must be at least 30 characters"),
  linkedin_url: z
    .string()
    .url("LinkedIn URL must be a valid URL")
    .refine((v) => /linkedin\.com/i.test(v), {
      message: "Author must have a valid linkedin.com URL for sameAs",
    }),
  twitter_url: z.string().url().optional(),
  avatar_url: z.string().url().optional(),
  expertise_keywords: z.array(z.string()).default([]),
});

// First-party data point — REQUIRED. At least one per post.
// Must come from the brand's own product, research, or customer data.
// NOT from cited external sources.
export const FirstPartyDataSchema = z.object({
  finding: z
    .string()
    .min(20, "First-party finding must be a specific statement (20+ chars)"),
  metric: z
    .string()
    .min(1, "Provide the exact metric or number (e.g., '47%', '1,200 prompts')"),
  source_description: z
    .string()
    .min(1, "How was this data collected (e.g., 'AnswerMonk internal audit data, Q4 2025')"),
  collected_at: z.string().optional(),
});

// Named real-world example — REQUIRED. At least 3 per post.
// Must reference a real company/product with specific, verifiable numbers.
// NOT "leading brands" or "top companies".
export const NamedExampleSchema = z.object({
  brand: z.string().min(1, "Specific brand name required (no generic 'companies')"),
  observation: z
    .string()
    .min(20, "Specific observation about this brand (20+ chars)"),
  metric: z.string().optional(),
  source_url: z.string().url().optional(),
});

// Original visual asset — REQUIRED. At least 1 per post.
// NOT stock images or AI-generated photographs.
export const OriginalVisualSchema = z.object({
  type: z.enum(["screenshot", "diagram", "chart", "framework", "product_ui"]),
  placement_hint: z.string().min(1, "Where this visual should appear in the article"),
  description: z
    .string()
    .min(20, "What the visual shows (for alt text and placement)"),
  asset_url: z.string().url().optional(), // if already uploaded; otherwise placeholder generated
  caption: z.string().optional(),
});

// Editorial stance — REQUIRED. 1-2 contrarian or opinionated claims.
// Must be restated in intro and conclusion.
export const EditorialStanceSchema = z.object({
  claim: z
    .string()
    .min(20, "Stance must be a specific, arguable claim (20+ chars)"),
  supporting_reasoning: z.string().min(20, "Brief rationale for the stance"),
});

export const BlogArticleOptionsSchema = z.object({
  slug: z.string().optional(),
  target_word_count: z.number().int().min(800).max(4000).default(1800),
  include_faq: z.boolean().default(true),
  include_howto_schema: z.boolean().default(false),
  include_comparison_table: z.boolean().default(false),
  cta_label: z.string().optional(),
  cta_url: z.string().url().optional(),
  author_name: z.string().default("TRYPS Editorial Team"),
  published_at: z.string().optional(),
  modified_at: z.string().optional(),
  hero_image_url: z.string().url().optional(),
  hero_image_alt: z.string().optional(),
  category: z.string().default("Travel Planning"),
  // NEW: quarterly refresh commitment (default 90 days from now)
  next_review_date: z.string().optional(),
});

export const BlogPostFormatSchema = z.enum([
  "destination_guide",
  "how_to",
  "comparison",
  "listicle",
  "article",
]);

export const BlogWriterRequestSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  primary_keyword: z.string().min(1, "Primary keyword is required"),
  secondary_keywords: z.array(z.string()).default([]),
  search_intent: z
    .enum(["informational", "commercial", "transactional", "navigational"])
    .default("informational"),
  audience: z.string().optional(),
  angle: z.string().optional(),
  post_format: BlogPostFormatSchema.optional(),
  brand: BlogBrandSchema,
  sources: z.array(BlogSourceSchema).min(1, "At least one source is required"),
  article: BlogArticleOptionsSchema.default({}),
  model: z.string().default("gpt-4.1"),
  // ─── 7 Human Signals (Google Helpful Content System compliance) ──────────
  // Set `enforce_human_signals: false` to opt out (legacy behavior).
  // When true (default), the writer requires all 7 signals and will fail if missing.
  enforce_human_signals: z.boolean().default(true),
  author: BlogAuthorSchema.optional(),
  first_party_data: z.array(FirstPartyDataSchema).default([]),
  named_examples: z.array(NamedExampleSchema).default([]),
  editorial_stance: EditorialStanceSchema.optional(),
  original_visuals: z.array(OriginalVisualSchema).default([]),
  reviewer: BlogAuthorSchema.optional(), // for reviewedBy schema — different from author
})
.superRefine((data, ctx) => {
  if (!data.enforce_human_signals) return;
  // Required: author
  if (!data.author) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["author"],
      message:
        "Author entity (name, title, bio, linkedin_url) is required when enforce_human_signals is true. This powers the E-E-A-T signals Google's Helpful Content System looks for.",
    });
  }
  // Required: 1+ first-party data point
  if (data.first_party_data.length < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["first_party_data"],
      message:
        "At least 1 first-party data point is required. This is the strongest differentiator from raw AI output — AI cannot run your experiments or query your product database.",
    });
  }
  // Required: 3+ named examples
  if (data.named_examples.length < 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["named_examples"],
      message:
        "At least 3 named examples (real brands with specific numbers) are required. Generic 'leading companies' language is what raw AI does and Google penalizes.",
    });
  }
  // Required: editorial stance
  if (!data.editorial_stance) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["editorial_stance"],
      message:
        "Editorial stance is required. AI averages training data and rarely takes a position. A clear POV is what distinguishes editorial content from generic AI output.",
    });
  }
  // Required: 1+ original visual
  if (data.original_visuals.length < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["original_visuals"],
      message:
        "At least 1 original visual (screenshot, diagram, chart, or framework) is required. AI cannot generate your product UI or original data charts.",
    });
  }
  // Required: 3+ primary-tier sources
  const primaryCount = data.sources.filter((s) => s.authority_tier === "primary").length;
  if (primaryCount < 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["sources"],
      message: `At least 3 'primary' authority-tier sources required (got ${primaryCount}). Primary = arXiv, OpenAI docs, Google Search Central, W3C, gov/edu, peer-reviewed research. Not marketing blogs.`,
    });
  }
});

export const BlogParagraphSchema = z.object({
  text: z.string().min(1),
  citation_ids: z.array(z.string()).default([]),
});

export const BlogSectionSchema = z.object({
  heading: z.string().min(1),
  purpose: z.string().min(1),
  paragraphs: z.array(BlogParagraphSchema).min(1),
  bullets: z.array(z.string()).default([]),
});

export const BlogFaqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  citation_ids: z.array(z.string()).default([]),
});

export const BlogBreadcrumbItemSchema = z.object({
  label: z.string().min(1),
  url: z.string().min(1),
});

export const BlogInternalLinkSchema = z.object({
  anchor: z.string().min(1),
  url: z.string().min(1),
  rationale: z.string().min(1),
});

export const BlogDraftSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  meta_title: z.string().min(1),
  meta_description: z.string().min(1),
  excerpt: z.string().min(1),
  format: BlogPostFormatSchema,
  breadcrumbs: z.array(BlogBreadcrumbItemSchema).min(2).max(4),
  quick_answer: z.array(z.string()).min(3).max(5),
  intro: z.array(BlogParagraphSchema).min(1),
  key_takeaways: z.array(z.string()).min(3).max(8),
  sections: z.array(BlogSectionSchema).min(3),
  summary_box: z.array(z.string()).min(3).max(5),
  faq: z.array(BlogFaqItemSchema).default([]),
  conclusion: z.array(BlogParagraphSchema).min(1),
  suggested_internal_links: z.array(BlogInternalLinkSchema).default([]),
  call_to_action: z
    .object({
      label: z.string().min(1),
      url: z.string().min(1),
      text: z.string().min(1),
    })
    .optional(),
  // NEW: places where first-party data was injected (for audit verification)
  first_party_data_anchors: z.array(z.string()).default([]),
  // NEW: editorial stance restated in the body
  stance_in_body: z.string().optional(),
});

export type BlogSource = z.infer<typeof BlogSourceSchema>;
export type BlogBrand = z.infer<typeof BlogBrandSchema>;
export type BlogAuthor = z.infer<typeof BlogAuthorSchema>;
export type FirstPartyData = z.infer<typeof FirstPartyDataSchema>;
export type NamedExample = z.infer<typeof NamedExampleSchema>;
export type OriginalVisual = z.infer<typeof OriginalVisualSchema>;
export type EditorialStance = z.infer<typeof EditorialStanceSchema>;
export type BlogWriterRequest = z.infer<typeof BlogWriterRequestSchema>;
export type BlogPostFormat = z.infer<typeof BlogPostFormatSchema>;
export type BlogParagraph = z.infer<typeof BlogParagraphSchema>;
export type BlogSection = z.infer<typeof BlogSectionSchema>;
export type BlogFaqItem = z.infer<typeof BlogFaqItemSchema>;
export type BlogBreadcrumbItem = z.infer<typeof BlogBreadcrumbItemSchema>;
export type BlogInternalLink = z.infer<typeof BlogInternalLinkSchema>;
export type BlogDraft = z.infer<typeof BlogDraftSchema>;

export interface BlogWriterResponse {
  request: {
    topic: string;
    primary_keyword: string;
    secondary_keywords: string[];
    search_intent: BlogWriterRequest["search_intent"];
    brand_name: string;
    canonical_url: string;
    source_count: number;
    // NEW: human-signal metadata
    human_signals_enforced: boolean;
    primary_source_count: number;
    first_party_data_count: number;
    named_examples_count: number;
    original_visuals_count: number;
    has_editorial_stance: boolean;
    has_author_entity: boolean;
  };
  article: BlogDraft;
  html: string;
  preview_html: string;
  json_ld: Record<string, unknown>;
  json_ld_string: string;
  references: BlogSource[];
  validation: {
    warnings: string[];
    uncited_source_ids: string[];
    // NEW: which human signals are missing or weak
    human_signal_gaps: string[];
    // NEW: placeholder visuals that need replacement before publishing
    pending_visual_placements: string[];
  };
  // NEW: machine-readable editorial integrity checklist
  // Publishers can gate on `publish_ready: true` before shipping the post.
  editorial_checklist: Array<{
    id: string;
    label: string;
    pass: boolean;
    detail: string;
  }>;
  checklist_passed: number;
  checklist_total: number;
  publish_ready: boolean;
}

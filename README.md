# Shakes-peer

Brand-agnostic blog writer with built-in Google Helpful Content System compliance.

Generates SEO, AEO, and GEO optimized blog posts that pass the 7 human-signal checks Google's Helpful Content System uses to distinguish editorial content from raw AI output.

## What it does

Given a brand, topic, and sources, Shakes-peer produces:
- `article.html` — publish-ready HTML with rich author byline, editorial stance banner, visual placeholders, author bio, and editorial integrity checklist
- `jsonld.json` — full Schema.org graph (Organization, WebPage, BlogPosting, FAQPage, BreadcrumbList, Person with `sameAs`, reviewedBy)
- `preview.html` — styled preview for reviewers
- `checklist.json` — machine-readable snapshot of which of the 10 editorial signals the post passed
- `audit.json` (write-and-audit) — 102-check audit across 6 sections including the new Human Signals section

## The 7 required human signals (enforced at 3 layers)

Every blog request is vetted by:

1. **Schema validation** — Zod `.superRefine` rejects the request if any signal is missing
2. **Writer prompt** — LLM is forced to weave each signal into the body
3. **Auditor Section F** — 8 post-generation checks score the finished HTML

| Signal | Required |
|--------|----------|
| Author entity with LinkedIn `sameAs` | Yes |
| First-party data (≥ 1 point) | Yes |
| Named examples (≥ 3 real brands with numbers) | Yes |
| Editorial stance (clear POV) | Yes |
| Original visuals (≥ 1 screenshot/diagram/chart) | Yes |
| Primary-tier citations (≥ 3 from arXiv / OpenAI / Google / gov / peer-reviewed) | Yes |
| Freshness commitment (`next_review_date`) | Yes |

## API

```
POST /blog/write              — generate and save to Desktop/shakes-peer/blogs
POST /blog/audit              — run 102-check audit on existing content
POST /blog/write-and-audit    — generate → audit → rewrite loop until score passes
```

## Request shape (minimum)

```json
{
  "topic": "...",
  "primary_keyword": "...",
  "brand": { "name": "...", "domain": "https://...", "product_description": "..." },
  "sources": [ { "id", "title", "url", "excerpt", "authority_tier": "primary" } ],
  "author": { "name", "title", "bio", "linkedin_url" },
  "first_party_data": [ { "finding", "metric", "source_description" } ],
  "named_examples": [ { "brand", "observation", "metric" } ],
  "editorial_stance": { "claim", "supporting_reasoning" },
  "original_visuals": [ { "type", "placement_hint", "description" } ]
}
```

## Output location

Every `/blog/write` call writes to two destinations:

**Canonical markdown — `blogs/<slug>.md` (in this repo)**
Portable source of truth with YAML front-matter, body, inline footnote citations, and an editorial integrity checklist. HTML and JSON-LD are derived renders — the markdown survives CMS migrations and is what downstream consumers should read. Auto-committed and pushed via the file-save hook.

**Full working set — `~/Desktop/shakes-peer/blogs/<brand-slug>-<post-slug>/`**
- `<slug>.md` — same markdown as the repo copy
- `<slug>.preview.html` — styled preview
- `<slug>.html` — raw article HTML
- `<slug>.jsonld.json` — schema.org graph
- `<slug>.package.json` — full writer response
- `<slug>.checklist.json` — editorial signals snapshot
- `<slug>.audit.json` — audit report (when `write-and-audit` is used)
- `index.json` at the folder root — rolling list of the last 500 generations

Set `SHAKESPEER_SAVE_TO_DESKTOP=false` to disable both.

To rebuild the markdown in `blogs/` from the historical `examples/generated/*.package.json` files:

```bash
npm run blog:seed-markdown
```

## Local dev

```bash
npm install
cp .env.example .env   # fill in OPENAI_API_KEY, ANTHROPIC_API_KEY, SERPAPI_KEY
npm run dev            # starts on :3000
```

## Stack

Express 5 · TypeScript · Zod · OpenAI / Anthropic · SerpAPI

## Auto-sync

Edits inside `serp-analyzer/` are auto-committed and pushed to `origin/main` (debounced, 4s window) by a Claude Code PostToolUse hook configured in `.claude/settings.local.json`. Disable by removing the hook.

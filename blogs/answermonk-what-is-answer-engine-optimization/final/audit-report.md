# Final Audit Report — answermonk-what-is-answer-engine-optimization

**Terminal:** 🔔 needs editorial review &nbsp;·&nbsp; **Final score:** 39/100 &nbsp;·&nbsp; **Rounds:** 2 &nbsp;·&nbsp; **Cost:** $0.3295

> reached maxRounds=2 with 4 open item(s) for editorial review

## TL;DR

- Score improved **36 → 39** (+3 points)
- **18 fixes applied** across 2 rounds
- **3 open item(s)** needing editorial input
- **4 critical escalation(s)** during the run

## Score progression

| Version | Score | Technical | Humanization | Quality | Critical | Applied this round |
|---------|-------|-----------|--------------|---------|----------|--------------------|
| v1 | — | — | — | — | — | 0 |
| v2 | 36 | 0 | 46 | 70 | 2 | 11 |
| v3 | 39 | 0 | 59 | 63 | 2 | 7 |

## ✅ Resolved during this run

- **`S_missing_DefinedTerm_schema`** (was fail) — definitional posts should have DefinedTerm schema — not present
- **`H_judge_specific_human_voice`** (was fail) — Specific human voice 1/10 — Reads as committee-written boilerplate with no individual voice or perspective.
- **`H_judge_specific_citations`** (was fail) — Specific citations 3/10 — Vague placeholder citations like [geo-arxiv]; no real numbers, prices, or named studies in-line.

## ⚠️ Still present at final

- **`D_Organization_missing_recommended`** (warn) — Organization missing recommended: sameAs, contactPoint
- **`D_WebPage_missing_recommended`** (warn) — WebPage missing recommended: dateModified, primaryImageOfPage
- **`P_faq_count_mismatch`** (fail) — FAQPage schema has 7 Questions but page shows ~14 FAQ pairs
- **`S_tldr_missing`** (fail) — No TL;DR block (expected <p data-tldr> or paragraph starting with 'TL;DR:')
- **`S_visible_last_updated_missing`** (warn) — No visible 'Last updated' / 'Last reviewed' / 'Next review' stamp on page (schema dateModified alone isn't enough for users or AI)
- **`E_author_sameas_missing`** (critical) — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- **`E_author_credentials_missing`** (warn) — Author has no jobTitle or description — credentials not stated
- **`E_no_first_party_data`** (fail) — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- **`E_human_signals_bundle_incomplete`** (critical) — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…
- **`H_em_dash_overuse`** (warn) — 12 em-dashes (3.73 per 400 words; target <1)
- **`H_tricolon_density`** (warn) — 10 tricolons (3.88/500 words; target ≤2)
- **`H_passive_overuse`** (warn) — Passive-voice ratio 18% (target <15%)
- **`H_judge_genuine_opinions`** (warn) — Genuine opinions 4/10 — A couple of opinionated lines exist but are drowned in generic safe claims.
- **`H_judge_unexpected_phrasings`** (warn) — Unexpected phrasings 4/10 — One fun Wikipedia-footnote line; the rest is boilerplate strings of nouns.
- **`H_judge_point_of_view`** (warn) — Point of view 4/10 — Mostly surveys both sides neutrally; rare POV flashes feel bolted on.
- **`H_judge_quotable_sentence`** (warn) — Quotable sentence 5/10 — The 'Wikipedia footnote nobody asked for' and 'no page two of ChatGPT' lines are quotable; most of the body isn't.
- **`H_judge_intro_earns_attention`** (fail) — Intro earns attention 2/10 — Opens with a generic TL;DR definition and even leaks an editor note ('Replace anonymous editorial byline...').
- **`Q_intro_hook`** (warn) — intro_hook 5/10 — The post opens with three competing 'definitions' in quick succession (TL;DR, inline def, Quick answer box) before any ge…
- **`Q_specificity`** (warn) — specificity 6/10 — The post has pockets of strong specificity—the Semrush 8,200-URL study, the 2.3x FAQPage citation lift, named schema typ…

## 🔔 Open items — needs human input

These cannot be auto-fixed because they require real human data. Fill the suggested brief fields and re-run to close them.

### E_author_sameas_missing

- **Severity:** critical
- **First seen:** v2 · **Last seen:** v3
- **Brief fields to populate:** `author.linkedin_url`
- **Evidence:** Author has no sameAs URLs (should link LinkedIn + at least one other profile)

### E_human_signals_bundle_incomplete

- **Severity:** critical
- **First seen:** v2 · **Last seen:** v3
- **Brief fields to populate:** `author`, `first_party_data`, `named_examples`, `original_visuals`
- **Evidence:** Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-flag risk

### E_no_first_party_data

- **Severity:** fail
- **First seen:** v2 · **Last seen:** v3
- **Brief fields to populate:** `first_party_data`
- **Evidence:** no patch/before to rewrite

## Where to find everything

- Final blog (markdown): [`./index.md`](./index.md)
- Final blog (HTML): [`./index.html`](./index.html)
- Full audit JSON: [`./audit.full.json`](./audit.full.json)
- Per-version reports: `../v1/audit-report.md`, `../v2/audit-report.md`, …
- Per-blog dashboard: [`../README.md`](../README.md)
- Machine-readable timeline: [`../history.json`](../history.json)

_Generated 2026-04-23T04:58:32.865Z_
# Final Audit Report — answermonk-what-is-answer-engine-optimization

**Terminal:** 🔔 needs editorial review &nbsp;·&nbsp; **Final score:** 41/100 &nbsp;·&nbsp; **Rounds:** 2 &nbsp;·&nbsp; **Cost:** $0.3455

_Auditor: blog-buster v0.1.6 @ da64c69_

> reached maxRounds=2 with 4 open item(s) for editorial review

## TL;DR

- Score improved **34 → 41** (+7 points)
- **20 fixes applied** across 2 rounds
- **3 open item(s)** needing editorial input
- **6 critical escalation(s)** during the run

## Score progression

| Version | Score | Technical | Humanization | Quality | Critical | Applied this round |
|---------|-------|-----------|--------------|---------|----------|--------------------|
| v1 | — | — | — | — | — | 0 |
| v2 | 34 | 0 | 48 | 60 | 2 | 11 |
| v3 | 41 | 0 | 63 | 63 | 2 | 9 |

## ✅ Resolved during this run

- **`S_tldr_missing`** (was fail) — No TL;DR block (expected <p data-tldr> or paragraph starting with 'TL;DR:')
- **`S_visible_last_updated_missing`** (was warn) — No visible 'Last updated' / 'Last reviewed' / 'Next review' stamp on page (schema dateModified alone isn't enough for users or AI)
- **`S_missing_DefinedTerm_schema`** (was fail) — definitional posts should have DefinedTerm schema — not present
- **`H_judge_specific_human_voice_vs_committee`** (was fail) — Specific human voice vs committee 1/10 — Reads as templated marketing content with no individual perspective.
- **`H_judge_genuine_opinions_vs_safe_claims`** (was fail) — Genuine opinions vs safe claims 1/10 — Every claim is hedged, generic, and safely sourced without any stance.
- **`H_judge_specific_citations_(names,_prices,_dates`** (was fail) — Specific citations (names, prices, dates) 3/10 — Names engines and one schema type but lacks concrete numbers, prices, or dated findings.
- **`H_judge_point_of_view_vs_neutral_survey`** (was fail) — Point of view vs neutral survey 2/10 — Presents balanced explainer without taking a side.
- **`H_judge_quotability`** (was fail) — Quotability 1/10 — No line has memorable phrasing worth sharing.

## ⚠️ Still present at final

- **`D_WebSite_missing_recommended`** (warn) — WebSite missing recommended: potentialAction
- **`D_ImageObject_missing_recommended`** (warn) — ImageObject missing recommended: creator, license
- **`D_Person_missing_recommended`** (warn) — Person missing recommended: jobTitle, sameAs, url, hasCredential
- **`P_faq_count_mismatch`** (fail) — FAQPage schema has 7 Questions but page shows ~13 FAQ pairs
- **`E_author_sameas_missing`** (critical) — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- **`E_author_credentials_missing`** (warn) — Author has no jobTitle or description — credentials not stated
- **`E_no_first_party_data`** (fail) — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- **`E_human_signals_bundle_incomplete`** (critical) — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…
- **`H_em_dash_overuse`** (warn) — 10 em-dashes (2.76 per 400 words; target <1)
- **`H_tricolon_density`** (warn) — 14 tricolons (4.84/500 words; target ≤2)
- **`H_judge_unexpected_phrasings`** (warn) — Unexpected phrasings 5/10 — Magpie metaphor and 'cheapest-to-cite source' are fresh, but most sentences read like template filler.
- **`H_judge_intro_earns_attention`** (fail) — Intro earns attention 2/10 — Opens with boilerplate TL;DR, byline metadata, and a textbook definition—zero hook, reader has no reason to co…
- **`Q_intro_hook`** (warn) — intro_hook 5/10 — The post's actual opening sentences (after the metadata block) are a dry definitional statement and a table-of-contents p…
- **`Q_specificity`** (warn) — specificity 6/10 — The post has one strong specific data point (the Semrush 34% Perplexity citation lift over 90 days) but much of the tact…

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

_Generated 2026-04-23T06:48:59.142Z_
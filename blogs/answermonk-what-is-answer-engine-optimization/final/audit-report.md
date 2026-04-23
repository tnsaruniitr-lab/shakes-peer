# Final Audit Report — answermonk-what-is-answer-engine-optimization

**Terminal:** 🔔 needs editorial review &nbsp;·&nbsp; **Final score:** 41/100 &nbsp;·&nbsp; **Rounds:** 2 &nbsp;·&nbsp; **Cost:** $0.3414

_Auditor: blog-buster v0.1.6 @ da64c69_

> reached maxRounds=2 with 4 open item(s) for editorial review

## TL;DR

- Score improved **33 → 41** (+8 points)
- **21 fixes applied** across 2 rounds
- **3 open item(s)** needing editorial input
- **6 critical escalation(s)** during the run

## Score progression

| Version | Score | Technical | Humanization | Quality | Critical | Applied this round |
|---------|-------|-----------|--------------|---------|----------|--------------------|
| v1 | — | — | — | — | — | 0 |
| v2 | 33 | 0 | 46 | 60 | 2 | 13 |
| v3 | 41 | 0 | 64 | 60 | 2 | 8 |

## ✅ Resolved during this run

- **`S_tldr_missing`** (was fail) — No TL;DR block (expected <p data-tldr> or paragraph starting with 'TL;DR:')
- **`S_visible_last_updated_missing`** (was warn) — No visible 'Last updated' / 'Last reviewed' / 'Next review' stamp on page (schema dateModified alone isn't enough for users or AI)
- **`S_missing_DefinedTerm_schema`** (was fail) — definitional posts should have DefinedTerm schema — not present
- **`H_judge_human_voice_vs_committee`** (was fail) — Human voice vs committee 1/10 — Reads like a template produced by a marketing committee, with no individual voice anywhere.
- **`H_judge_unexpected_phrasing`** (was fail) — Unexpected phrasing 1/10 — Entirely boilerplate phrasing; 'dominate product discovery,' 'informational landscape,' 'decision journeys.'
- **`H_judge_specific_citations_(names,_prices,_dates`** (was fail) — Specific citations (names, prices, dates) 3/10 — Names a few LLMs and one schema type, but zero prices, dates, people, or concrete case dat…
- **`H_judge_point_of_view_vs_neutral_survey`** (was fail) — Point of view vs neutral survey 2/10 — Balanced, encyclopedic framing throughout; takes no stance.
- **`H_judge_quotability`** (was fail) — Quotability 1/10 — Nothing here is memorable or forwardable.

## ⚠️ Still present at final

- **`D_Person_missing_recommended`** (warn) — Person missing recommended: jobTitle, sameAs, hasCredential
- **`P_faq_count_mismatch`** (fail) — FAQPage schema has 7 Questions but page shows ~13 FAQ pairs
- **`S_h2_question_ratio_low`** (warn) — 5/14 H2s are questions (36% — target ≥40%)
- **`E_author_sameas_missing`** (critical) — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- **`E_author_credentials_missing`** (warn) — Author has no jobTitle or description — credentials not stated
- **`E_no_first_party_data`** (fail) — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- **`E_human_signals_bundle_incomplete`** (critical) — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…
- **`H_em_dash_overuse`** (warn) — 15 em-dashes (4.57 per 400 words; target <1)
- **`H_tricolon_density`** (warn) — 16 tricolons (6.09/500 words; target ≤2)
- **`H_passive_overuse`** (warn) — Passive-voice ratio 18% (target <15%)
- **`H_judge_genuine_opinions_vs_safe_claims`** (warn) — Genuine opinions vs safe claims 5/10 — A couple of opinionated jabs exist, but most claims hedge into generic best-practice territory.
- **`H_judge_intro_earns_attention`** (fail) — Intro earns attention 3/10 — Opens with duplicated nav/title clutter and a generic TL;DR. Nothing hooks the reader in the first two sentenc…
- **`Q_intro_hook`** (warn) — intro_hook 5/10 — The first two body sentences are pure definition-throat-clearing. The most arresting fact in the entire post—the 34% vs 4…
- **`Q_specificity`** (warn) — specificity 6/10 — Several bullet-point summary lines ('It influences brand perception in generative search,' 'Emphasize freshness and auth…

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

_Generated 2026-04-23T07:03:06.345Z_
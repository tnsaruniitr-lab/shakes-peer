# answermonk-what-is-answer-engine-optimization

**Terminal:** 🔔 needs editorial review &nbsp; **Cost:** $0.3455 &nbsp; **Versions:** 3 &nbsp; **Open items:** 3
_Auditor: blog-buster v0.1.6 @ da64c69_

> reached maxRounds=2 with 4 open item(s) for editorial review

## 🔔 Open items — editorial review needed

These findings can't be auto-fixed because they require real human data (author credentials, first-party research, named examples, original visuals). The blog still ships with every auto-fixable improvement applied; these are tracked so an editor can resolve them before publish.

| Check | Severity | First seen | Last seen | Evidence | Suggested fields |
|-------|----------|------------|-----------|----------|------------------|
| E_author_sameas_missing | critical | v2 | v3 | Author has no sameAs URLs (should link LinkedIn + at least one other profile) | `author.linkedin_url` |
| E_human_signals_bundle_incomplete | critical | v2 | v3 | Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true… | `author`, `first_party_data`, `named_examples`, `original_visuals` |
| E_no_first_party_data | fail | v2 | v3 | no patch/before to rewrite | `first_party_data` |

## Score progression

| Version | Score | Technical | Humanization | Quality | Critical | Verdict | Cost | Inner iter | Commit |
|---------|-------|-----------|--------------|---------|----------|---------|------|------------|--------|
| v1 | — | — | — | — | — | — | $0.0000 | 0 | 1f81231 |
| v2 | 34 | 0 | 48 | 60 | 2 | block | $0.1662 | 1 | 2924588 |
| v3 | 41 | 0 | 63 | 63 | 2 | block | $0.1793 | 1 | 033833d |

## Findings resolved across the run

**8 fixed** &nbsp;·&nbsp; **14 still present** &nbsp;·&nbsp; **0 regressed**

### ✅ Fixed

- `S_tldr_missing` (fail) — No TL;DR block (expected <p data-tldr> or paragraph starting with 'TL;DR:')
- `S_visible_last_updated_missing` (warn) — No visible 'Last updated' / 'Last reviewed' / 'Next review' stamp on page (schema dateModified alone isn't en…
- `S_missing_DefinedTerm_schema` (fail) — definitional posts should have DefinedTerm schema — not present
- `H_judge_specific_human_voice_vs_committee` (fail) — Specific human voice vs committee 1/10 — Reads as templated marketing content with no individual perspective.
- `H_judge_genuine_opinions_vs_safe_claims` (fail) — Genuine opinions vs safe claims 1/10 — Every claim is hedged, generic, and safely sourced without any stance.
- `H_judge_specific_citations_(names,_prices,_dates` (fail) — Specific citations (names, prices, dates) 3/10 — Names engines and one schema type but lacks concrete numbers…
- `H_judge_point_of_view_vs_neutral_survey` (fail) — Point of view vs neutral survey 2/10 — Presents balanced explainer without taking a side.
- `H_judge_quotability` (fail) — Quotability 1/10 — No line has memorable phrasing worth sharing.

### ⚠️ Still present at final

- `D_WebSite_missing_recommended` (warn) — WebSite missing recommended: potentialAction
- `D_ImageObject_missing_recommended` (warn) — ImageObject missing recommended: creator, license
- `D_Person_missing_recommended` (warn) — Person missing recommended: jobTitle, sameAs, url, hasCredential
- `P_faq_count_mismatch` (fail) — FAQPage schema has 7 Questions but page shows ~13 FAQ pairs
- `E_author_sameas_missing` (critical) — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_author_credentials_missing` (warn) — Author has no jobTitle or description — credentials not stated
- `E_no_first_party_data` (fail) — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observa…
- `E_human_signals_bundle_incomplete` (critical) — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citat…
- `H_em_dash_overuse` (warn) — 10 em-dashes (2.76 per 400 words; target <1)
- `H_tricolon_density` (warn) — 14 tricolons (4.84/500 words; target ≤2)
- `H_judge_unexpected_phrasings` (warn) — Unexpected phrasings 5/10 — Magpie metaphor and 'cheapest-to-cite source' are fresh, but most sentences read …
- `H_judge_intro_earns_attention` (fail) — Intro earns attention 2/10 — Opens with boilerplate TL;DR, byline metadata, and a textbook definition—zero ho…
- `Q_intro_hook` (warn) — intro_hook 5/10 — The post's actual opening sentences (after the metadata block) are a dry definitional state…
- `Q_specificity` (warn) — specificity 6/10 — The post has one strong specific data point (the Semrush 34% Perplexity citation lift over…

## Handler activity per round

| Version | Applied | Skipped | Drift | Ambiguous | Escalated | Failed |
|---------|---------|---------|-------|-----------|-----------|--------|
| v2 | 11 | 5 | 7 | 0 | 3 | 0 |
| v3 | 9 | 7 | 5 | 0 | 3 | 0 |

_Last updated: 2026-04-23T06:48:59.142Z_
# answermonk-what-is-answer-engine-optimization

**Terminal:** 🔔 needs editorial review &nbsp; **Cost:** $0.3414 &nbsp; **Versions:** 3 &nbsp; **Open items:** 3
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
| v1 | — | — | — | — | — | — | $0.0000 | 0 | b08a578 |
| v2 | 33 | 0 | 46 | 60 | 2 | block | $0.1729 | 1 | 429901f |
| v3 | 41 | 0 | 64 | 60 | 2 | block | $0.1684 | 1 | 89bd071 |

## Findings resolved across the run

**8 fixed** &nbsp;·&nbsp; **14 still present** &nbsp;·&nbsp; **0 regressed**

### ✅ Fixed

- `S_tldr_missing` (fail) — No TL;DR block (expected <p data-tldr> or paragraph starting with 'TL;DR:')
- `S_visible_last_updated_missing` (warn) — No visible 'Last updated' / 'Last reviewed' / 'Next review' stamp on page (schema dateModified alone isn't en…
- `S_missing_DefinedTerm_schema` (fail) — definitional posts should have DefinedTerm schema — not present
- `H_judge_human_voice_vs_committee` (fail) — Human voice vs committee 1/10 — Reads like a template produced by a marketing committee, with no individual v…
- `H_judge_unexpected_phrasing` (fail) — Unexpected phrasing 1/10 — Entirely boilerplate phrasing; 'dominate product discovery,' 'informational landsc…
- `H_judge_specific_citations_(names,_prices,_dates` (fail) — Specific citations (names, prices, dates) 3/10 — Names a few LLMs and one schema type, but zero prices, dates…
- `H_judge_point_of_view_vs_neutral_survey` (fail) — Point of view vs neutral survey 2/10 — Balanced, encyclopedic framing throughout; takes no stance.
- `H_judge_quotability` (fail) — Quotability 1/10 — Nothing here is memorable or forwardable.

### ⚠️ Still present at final

- `D_Person_missing_recommended` (warn) — Person missing recommended: jobTitle, sameAs, hasCredential
- `P_faq_count_mismatch` (fail) — FAQPage schema has 7 Questions but page shows ~13 FAQ pairs
- `S_h2_question_ratio_low` (warn) — 5/14 H2s are questions (36% — target ≥40%)
- `E_author_sameas_missing` (critical) — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_author_credentials_missing` (warn) — Author has no jobTitle or description — credentials not stated
- `E_no_first_party_data` (fail) — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observa…
- `E_human_signals_bundle_incomplete` (critical) — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citat…
- `H_em_dash_overuse` (warn) — 15 em-dashes (4.57 per 400 words; target <1)
- `H_tricolon_density` (warn) — 16 tricolons (6.09/500 words; target ≤2)
- `H_passive_overuse` (warn) — Passive-voice ratio 18% (target <15%)
- `H_judge_genuine_opinions_vs_safe_claims` (warn) — Genuine opinions vs safe claims 5/10 — A couple of opinionated jabs exist, but most claims hedge into generic…
- `H_judge_intro_earns_attention` (fail) — Intro earns attention 3/10 — Opens with duplicated nav/title clutter and a generic TL;DR. Nothing hooks the r…
- `Q_intro_hook` (warn) — intro_hook 5/10 — The first two body sentences are pure definition-throat-clearing. The most arresting fact i…
- `Q_specificity` (warn) — specificity 6/10 — Several bullet-point summary lines ('It influences brand perception in generative search,'…

## Handler activity per round

| Version | Applied | Skipped | Drift | Ambiguous | Escalated | Failed |
|---------|---------|---------|-------|-----------|-----------|--------|
| v2 | 13 | 3 | 14 | 1 | 3 | 0 |
| v3 | 8 | 6 | 16 | 0 | 3 | 0 |

_Last updated: 2026-04-23T07:03:06.345Z_
# answermonk-what-is-answer-engine-optimization

**Terminal:** 🔔 needs editorial review &nbsp; **Cost:** $0.3604 &nbsp; **Versions:** 3 &nbsp; **Open items:** 3
_Auditor: blog-buster v0.1.4 @ d6179c6_

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
| v1 | — | — | — | — | — | — | $0.0000 | 0 | b4d1ee2 |
| v2 | 37 | 0 | 47 | 73 | 2 | block | $0.1818 | 1 | 057be05 |
| v3 | 46 | 7 | 64 | 70 | 2 | block | $0.1786 | 1 | 291a220 |

## Findings resolved across the run

**7 fixed** &nbsp;·&nbsp; **13 still present** &nbsp;·&nbsp; **0 regressed**

### ✅ Fixed

- `D_Organization_missing_recommended` (warn) — Organization missing recommended: logo, sameAs, contactPoint
- `D_WebPage_missing_recommended` (warn) — WebPage missing recommended: dateModified, isPartOf, primaryImageOfPage, inLanguage
- `S_tldr_missing` (fail) — No TL;DR block (expected <p data-tldr> or paragraph starting with 'TL;DR:')
- `S_visible_last_updated_missing` (warn) — No visible 'Last updated' / 'Last reviewed' / 'Next review' stamp on page (schema dateModified alone isn't en…
- `S_missing_DefinedTerm_schema` (fail) — definitional posts should have DefinedTerm schema — not present
- `H_judge_unexpected_phrasing` (fail) — Unexpected phrasing 1/10 — Phrasing is entirely predictable AI boilerplate: 'discipline of', 'intent fulfillm…
- `H_judge_specific_citations_(names/places/prices/` (fail) — Specific citations (names/places/prices/dates) 3/10 — Names engines and vague references but no actual number…

### ⚠️ Still present at final

- `P_faq_count_mismatch` (fail) — FAQPage schema has 8 Questions but page shows ~15 FAQ pairs
- `E_author_sameas_missing` (critical) — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_author_credentials_missing` (warn) — Author has no jobTitle or description — credentials not stated
- `E_no_first_party_data` (fail) — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observa…
- `E_human_signals_bundle_incomplete` (critical) — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citat…
- `H_em_dash_overuse` (warn) — 17 em-dashes (4.71 per 400 words; target <1)
- `H_tricolon_density` (warn) — 20 tricolons (6.92/500 words; target ≤2)
- `H_judge_human_voice_vs_committee` (fail) — Human voice vs committee 3/10 — Reads like a content template with brief injected 'spicy' lines that feel bol…
- `H_judge_genuine_opinions_vs_safe_claims` (warn) — Genuine opinions vs safe claims 5/10 — A few contrarian lines exist (schema overrated, E-E-A-T red herring) b…
- `H_judge_point_of_view_vs_both-sides_survey` (warn) — Point of view vs both-sides survey 5/10 — Has glimmers of a POV but quickly retreats to balanced, hedged reco…
- `H_judge_quotability` (warn) — Quotability 4/10 — The 'lazy LLM paste' line is quotable; most others are forgettable definitional boilerplat…
- `H_judge_intro_earns_attention` (fail) — Intro earns attention 3/10 — Opens with a textbook definition repeated three times (TL;DR, quick answer, intr…
- `Q_specificity` (warn) — specificity 6/10 — The measurement section collapses into abstractions at key moments—'tools that aggregate,'…

## Handler activity per round

| Version | Applied | Skipped | Drift | Ambiguous | Escalated | Failed |
|---------|---------|---------|-------|-----------|-----------|--------|
| v2 | 11 | 3 | 1 | 2 | 3 | 0 |
| v3 | 6 | 3 | 0 | 3 | 3 | 0 |

_Last updated: 2026-04-23T06:22:41.491Z_
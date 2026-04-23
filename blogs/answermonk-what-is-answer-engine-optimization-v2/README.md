# answermonk-what-is-answer-engine-optimization-v2

**Terminal:** 🔔 needs editorial review &nbsp; **Cost:** $0.4826 &nbsp; **Versions:** 4 &nbsp; **Open items:** 3
_Auditor: blog-buster v0.1.6 @ da64c69_

> reached maxRounds=3 with 6 open item(s) for editorial review

## 🔔 Open items — editorial review needed

These findings can't be auto-fixed because they require real human data (author credentials, first-party research, named examples, original visuals). The blog still ships with every auto-fixable improvement applied; these are tracked so an editor can resolve them before publish.

| Check | Severity | First seen | Last seen | Evidence | Suggested fields |
|-------|----------|------------|-----------|----------|------------------|
| E_author_sameas_missing | critical | v2 | v4 | Author has no sameAs URLs (should link LinkedIn + at least one other profile) | `author.linkedin_url` |
| E_human_signals_bundle_incomplete | critical | v2 | v4 | Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true… | `author`, `first_party_data`, `named_examples`, `original_visuals` |
| E_no_first_party_data | fail | v2 | v4 | no patch/before to rewrite | `first_party_data` |

## Score progression

| Version | Score | Technical | Humanization | Quality | Critical | Verdict | Cost | Inner iter | Commit |
|---------|-------|-----------|--------------|---------|----------|---------|------|------------|--------|
| v1 | — | — | — | — | — | — | $0.0000 | 0 | 633a45c |
| v2 | 35 | 0 | 43 | 70 | 2 | block | $0.1713 | 1 | 0564de1 |
| v3 | 41 | 0 | 58 | 73 | 2 | block | $0.1580 | 1 | 5b9b8d0 |
| v4 | 40 | 0 | 59 | 67 | 2 | block | $0.1533 | 1 | 7ec4b81 |

## Findings resolved across the run

**4 fixed** &nbsp;·&nbsp; **14 still present** &nbsp;·&nbsp; **0 regressed**

### ✅ Fixed

- `H_judge_genuine_opinions_vs_safe_claims` (warn) — Genuine opinions vs safe claims 6/10 — A few sharp takes (E-E-A-T is theater, most AEO advice is garbage) exi…
- `H_judge_point_of_view_vs_both-sides_survey` (warn) — Point of view vs both-sides survey 5/10 — Has a POV in flashes but defaults to neutral explainer-comparison m…
- `H_judge_quotable_to_a_friend` (warn) — Quotable to a friend 6/10 — "The winners in AEO aren't the loudest—they're the most quotable" and the E-E-A-T…
- `H_judge_intro_earns_attention_in_2_sentences` (fail) — Intro earns attention in 2 sentences 3/10 — Opens with navigation crumbs, repeated titles, dateline, and a te…

### ⚠️ Still present at final

- `D_Person_missing_recommended` (warn) — Person missing recommended: jobTitle, sameAs, hasCredential
- `D_entity_missing_id` (warn) — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `P_faq_count_mismatch` (fail) — FAQPage schema has 7 Questions but page shows ~14 FAQ pairs
- `E_author_sameas_missing` (critical) — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_author_credentials_missing` (warn) — Author has no jobTitle or description — credentials not stated
- `E_no_first_party_data` (fail) — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observa…
- `E_human_signals_bundle_incomplete` (critical) — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citat…
- `H_em_dash_overuse` (warn) — 7 em-dashes (2.31 per 400 words; target <1)
- `H_tricolon_density` (warn) — 9 tricolons (3.71/500 words; target ≤2)
- `H_banned_vocabulary` (fail) — AI-signature vocabulary present: robust(1)
- `H_passive_overuse` (warn) — Passive-voice ratio 21% (target <15%)
- `H_judge_human_voice_vs_committee` (warn) — Human voice vs committee 4/10 — Mostly committee-speak with scattered flashes of voice ('writing sentences an…
- `H_judge_unexpected_phrasings` (warn) — Unexpected phrasings 5/10 — A few vivid lines ('quotable source, period') are surrounded by predictable SEO-b…
- `Q_intro_hook` (warn) — intro_hook 6/10 — The post opens with a competent TL;DR but then immediately restates the definition verbatim…

## Handler activity per round

| Version | Applied | Skipped | Drift | Ambiguous | Escalated | Failed |
|---------|---------|---------|-------|-----------|-----------|--------|
| v2 | 14 | 3 | 9 | 0 | 3 | 0 |
| v3 | 8 | 6 | 11 | 0 | 3 | 0 |
| v4 | 8 | 6 | 14 | 0 | 3 | 0 |

_Last updated: 2026-04-23T07:19:22.924Z_
# answermonk-what-is-answer-engine-optimization

**Terminal:** 🔔 needs editorial review &nbsp; **Cost:** $0.3295 &nbsp; **Versions:** 3 &nbsp; **Open items:** 3

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
| v1 | — | — | — | — | — | — | $0.0000 | 0 | b351184 |
| v2 | 36 | 0 | 46 | 70 | 2 | block | $0.1648 | 1 | db7d6e6 |
| v3 | 39 | 0 | 59 | 63 | 2 | block | $0.1648 | 1 | 0ef846a |

## Findings resolved across the run

**3 fixed** &nbsp;·&nbsp; **19 still present** &nbsp;·&nbsp; **0 regressed**

### ✅ Fixed

- `S_missing_DefinedTerm_schema` (fail) — definitional posts should have DefinedTerm schema — not present
- `H_judge_specific_human_voice` (fail) — Specific human voice 1/10 — Reads as committee-written boilerplate with no individual voice or perspective.
- `H_judge_specific_citations` (fail) — Specific citations 3/10 — Vague placeholder citations like [geo-arxiv]; no real numbers, prices, or named stu…

### ⚠️ Still present at final

- `D_Organization_missing_recommended` (warn) — Organization missing recommended: sameAs, contactPoint
- `D_WebPage_missing_recommended` (warn) — WebPage missing recommended: dateModified, primaryImageOfPage
- `P_faq_count_mismatch` (fail) — FAQPage schema has 7 Questions but page shows ~14 FAQ pairs
- `S_tldr_missing` (fail) — No TL;DR block (expected <p data-tldr> or paragraph starting with 'TL;DR:')
- `S_visible_last_updated_missing` (warn) — No visible 'Last updated' / 'Last reviewed' / 'Next review' stamp on page (schema dateModified alone isn't en…
- `E_author_sameas_missing` (critical) — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_author_credentials_missing` (warn) — Author has no jobTitle or description — credentials not stated
- `E_no_first_party_data` (fail) — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observa…
- `E_human_signals_bundle_incomplete` (critical) — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citat…
- `H_em_dash_overuse` (warn) — 12 em-dashes (3.73 per 400 words; target <1)
- `H_tricolon_density` (warn) — 10 tricolons (3.88/500 words; target ≤2)
- `H_passive_overuse` (warn) — Passive-voice ratio 18% (target <15%)
- `H_judge_genuine_opinions` (warn) — Genuine opinions 4/10 — A couple of opinionated lines exist but are drowned in generic safe claims.
- `H_judge_unexpected_phrasings` (warn) — Unexpected phrasings 4/10 — One fun Wikipedia-footnote line; the rest is boilerplate strings of nouns.
- `H_judge_point_of_view` (warn) — Point of view 4/10 — Mostly surveys both sides neutrally; rare POV flashes feel bolted on.
- `H_judge_quotable_sentence` (warn) — Quotable sentence 5/10 — The 'Wikipedia footnote nobody asked for' and 'no page two of ChatGPT' lines are quo…
- `H_judge_intro_earns_attention` (fail) — Intro earns attention 2/10 — Opens with a generic TL;DR definition and even leaks an editor note ('Replace an…
- `Q_intro_hook` (warn) — intro_hook 5/10 — The post opens with three competing 'definitions' in quick succession (TL;DR, inline def, Q…
- `Q_specificity` (warn) — specificity 6/10 — The post has pockets of strong specificity—the Semrush 8,200-URL study, the 2.3x FAQPage c…

## Handler activity per round

| Version | Applied | Skipped | Drift | Ambiguous | Escalated | Failed |
|---------|---------|---------|-------|-----------|-----------|--------|
| v2 | 11 | 6 | 0 | 3 | 2 | 0 |
| v3 | 7 | 8 | 1 | 2 | 2 | 0 |

_Last updated: 2026-04-23T04:58:32.865Z_
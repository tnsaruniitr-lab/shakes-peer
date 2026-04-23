# Final Audit Report — answermonk-what-is-answer-engine-optimization

**Terminal:** 🔔 needs editorial review &nbsp;·&nbsp; **Final score:** 46/100 &nbsp;·&nbsp; **Rounds:** 2 &nbsp;·&nbsp; **Cost:** $0.3604

_Auditor: blog-buster v0.1.4 @ d6179c6_

> reached maxRounds=2 with 4 open item(s) for editorial review

## TL;DR

- Score improved **37 → 46** (+9 points)
- **17 fixes applied** across 2 rounds
- **3 open item(s)** needing editorial input
- **6 critical escalation(s)** during the run

## Score progression

| Version | Score | Technical | Humanization | Quality | Critical | Applied this round |
|---------|-------|-----------|--------------|---------|----------|--------------------|
| v1 | — | — | — | — | — | 0 |
| v2 | 37 | 0 | 47 | 73 | 2 | 11 |
| v3 | 46 | 7 | 64 | 70 | 2 | 6 |

## ✅ Resolved during this run

- **`D_Organization_missing_recommended`** (was warn) — Organization missing recommended: logo, sameAs, contactPoint
- **`D_WebPage_missing_recommended`** (was warn) — WebPage missing recommended: dateModified, isPartOf, primaryImageOfPage, inLanguage
- **`S_tldr_missing`** (was fail) — No TL;DR block (expected <p data-tldr> or paragraph starting with 'TL;DR:')
- **`S_visible_last_updated_missing`** (was warn) — No visible 'Last updated' / 'Last reviewed' / 'Next review' stamp on page (schema dateModified alone isn't enough for users or AI)
- **`S_missing_DefinedTerm_schema`** (was fail) — definitional posts should have DefinedTerm schema — not present
- **`H_judge_unexpected_phrasing`** (was fail) — Unexpected phrasing 1/10 — Phrasing is entirely predictable AI boilerplate: 'discipline of', 'intent fulfillment', 'citation-worthy signals…
- **`H_judge_specific_citations_(names/places/prices/`** (was fail) — Specific citations (names/places/prices/dates) 3/10 — Names engines and vague references but no actual numbers, studies, people, prices, or…

## ⚠️ Still present at final

- **`P_faq_count_mismatch`** (fail) — FAQPage schema has 8 Questions but page shows ~15 FAQ pairs
- **`E_author_sameas_missing`** (critical) — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- **`E_author_credentials_missing`** (warn) — Author has no jobTitle or description — credentials not stated
- **`E_no_first_party_data`** (fail) — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- **`E_human_signals_bundle_incomplete`** (critical) — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…
- **`H_em_dash_overuse`** (warn) — 17 em-dashes (4.71 per 400 words; target <1)
- **`H_tricolon_density`** (warn) — 20 tricolons (6.92/500 words; target ≤2)
- **`H_judge_human_voice_vs_committee`** (fail) — Human voice vs committee 3/10 — Reads like a content template with brief injected 'spicy' lines that feel bolted on.
- **`H_judge_genuine_opinions_vs_safe_claims`** (warn) — Genuine opinions vs safe claims 5/10 — A few contrarian lines exist (schema overrated, E-E-A-T red herring) but most claims are safe and ge…
- **`H_judge_point_of_view_vs_both-sides_survey`** (warn) — Point of view vs both-sides survey 5/10 — Has glimmers of a POV but quickly retreats to balanced, hedged recommendations.
- **`H_judge_quotability`** (warn) — Quotability 4/10 — The 'lazy LLM paste' line is quotable; most others are forgettable definitional boilerplate.
- **`H_judge_intro_earns_attention`** (fail) — Intro earns attention 3/10 — Opens with a textbook definition repeated three times (TL;DR, quick answer, intro) before saying anything inte…
- **`Q_specificity`** (warn) — specificity 6/10 — The measurement section collapses into abstractions at key moments—'tools that aggregate,' 'refine content to strengthen…

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

_Generated 2026-04-23T06:22:41.491Z_
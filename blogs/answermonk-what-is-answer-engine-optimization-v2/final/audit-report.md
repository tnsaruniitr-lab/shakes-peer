# Final Audit Report — answermonk-what-is-answer-engine-optimization-v2

**Terminal:** 🔔 needs editorial review &nbsp;·&nbsp; **Final score:** 40/100 &nbsp;·&nbsp; **Rounds:** 3 &nbsp;·&nbsp; **Cost:** $0.4826

_Auditor: blog-buster v0.1.6 @ da64c69_

> reached maxRounds=3 with 6 open item(s) for editorial review

## TL;DR

- Score improved **35 → 40** (+5 points)
- **30 fixes applied** across 3 rounds
- **3 open item(s)** needing editorial input
- **9 critical escalation(s)** during the run

## Score progression

| Version | Score | Technical | Humanization | Quality | Critical | Applied this round |
|---------|-------|-----------|--------------|---------|----------|--------------------|
| v1 | — | — | — | — | — | 0 |
| v2 | 35 | 0 | 43 | 70 | 2 | 14 |
| v3 | 41 | 0 | 58 | 73 | 2 | 8 |
| v4 | 40 | 0 | 59 | 67 | 2 | 8 |

## ✅ Resolved during this run

- **`H_judge_genuine_opinions_vs_safe_claims`** (was warn) — Genuine opinions vs safe claims 6/10 — A few sharp takes (E-E-A-T is theater, most AEO advice is garbage) exist but are surrounded by hedge…
- **`H_judge_point_of_view_vs_both-sides_survey`** (was warn) — Point of view vs both-sides survey 5/10 — Has a POV in flashes but defaults to neutral explainer-comparison mode.
- **`H_judge_quotable_to_a_friend`** (was warn) — Quotable to a friend 6/10 — "The winners in AEO aren't the loudest—they're the most quotable" and the E-E-A-T line are genuinely quotable; …
- **`H_judge_intro_earns_attention_in_2_sentences`** (was fail) — Intro earns attention in 2 sentences 3/10 — Opens with navigation crumbs, repeated titles, dateline, and a textbook definition—nothing earn…

## ⚠️ Still present at final

- **`D_Person_missing_recommended`** (warn) — Person missing recommended: jobTitle, sameAs, hasCredential
- **`D_entity_missing_id`** (warn) — Entity of type FAQPage has no @id — cross-page interconnection blocked
- **`P_faq_count_mismatch`** (fail) — FAQPage schema has 7 Questions but page shows ~14 FAQ pairs
- **`E_author_sameas_missing`** (critical) — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- **`E_author_credentials_missing`** (warn) — Author has no jobTitle or description — credentials not stated
- **`E_no_first_party_data`** (fail) — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- **`E_human_signals_bundle_incomplete`** (critical) — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…
- **`H_em_dash_overuse`** (warn) — 7 em-dashes (2.31 per 400 words; target <1)
- **`H_tricolon_density`** (warn) — 9 tricolons (3.71/500 words; target ≤2)
- **`H_banned_vocabulary`** (fail) — AI-signature vocabulary present: robust(1)
- **`H_passive_overuse`** (warn) — Passive-voice ratio 21% (target <15%)
- **`H_judge_human_voice_vs_committee`** (warn) — Human voice vs committee 4/10 — Mostly committee-speak with scattered flashes of voice ('writing sentences an LLM can lift without embarras…
- **`H_judge_unexpected_phrasings`** (warn) — Unexpected phrasings 5/10 — A few vivid lines ('quotable source, period') are surrounded by predictable SEO-blog phrasing.
- **`Q_intro_hook`** (warn) — intro_hook 6/10 — The post opens with a competent TL;DR but then immediately restates the definition verbatim in the first body sentence. T…

## 🔔 Open items — needs human input

These cannot be auto-fixed because they require real human data. Fill the suggested brief fields and re-run to close them.

### E_author_sameas_missing

- **Severity:** critical
- **First seen:** v2 · **Last seen:** v4
- **Brief fields to populate:** `author.linkedin_url`
- **Evidence:** Author has no sameAs URLs (should link LinkedIn + at least one other profile)

### E_human_signals_bundle_incomplete

- **Severity:** critical
- **First seen:** v2 · **Last seen:** v4
- **Brief fields to populate:** `author`, `first_party_data`, `named_examples`, `original_visuals`
- **Evidence:** Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-flag risk

### E_no_first_party_data

- **Severity:** fail
- **First seen:** v2 · **Last seen:** v4
- **Brief fields to populate:** `first_party_data`
- **Evidence:** no patch/before to rewrite

## Where to find everything

- Final blog (markdown): [`./index.md`](./index.md)
- Final blog (HTML): [`./index.html`](./index.html)
- Full audit JSON: [`./audit.full.json`](./audit.full.json)
- Per-version reports: `../v1/audit-report.md`, `../v2/audit-report.md`, …
- Per-blog dashboard: [`../README.md`](../README.md)
- Machine-readable timeline: [`../history.json`](../history.json)

_Generated 2026-04-23T07:19:22.924Z_
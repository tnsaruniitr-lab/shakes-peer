# v2 — Audit Report

**Score:** 49/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1908

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 78 |
| Quality | 73 |
| **Overall** | **49** |

## Findings at this version (16)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (4)
- `P_faq_count_mismatch` — FAQPage schema has 9 Questions but page shows ~15 FAQ pairs
- `S_tldr_missing` — No TL;DR block (expected <p data-tldr> or paragraph starting with 'TL;DR:')
- `S_word_count_below_band` — 1345 words is below pillar minimum 1900 (target 2500)
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation

### 🟡 warn (10)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `S_h2_question_ratio_low` — 4/14 H2s are questions (29% — target ≥40%)
- `S_visible_last_updated_missing` — No visible 'Last updated' / 'Last reviewed' / 'Next review' stamp on page (schema dateModified alone isn't enough for users or AI)
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_judge_human_voice_vs_committee` — Human voice vs committee 4/10 — Has flashes of voice ('who's on aux') but mostly reads like SEO template output with SERP-style headings.
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 6/10 — Some opinions exist (Duke's is touristy but fine, Pig and the Lady non-negotiable) but most claims a…
- `H_judge_unexpected_phrasings` — Unexpected phrasings 6/10 — A few good lines ('who's on aux', 'survive the group chat') but padded with predictable phrasing elsewhere.
- `H_judge_point_of_view_vs_both-sides` — Point of view vs both-sides 6/10 — Takes stances in places but FAQ section drifts into neutral survey mode.
- `H_judge_quotable_sentences` — Quotable sentences 5/10 — 'Who's on aux' is quotable; most sentences are functional rather than shareable.
- `Q_specificity` — specificity 6/10 — The budget section introduces a cost table but the surrounding prose retreats into abstractions — 'costs can spiral,' 's…

## What we did this round

Applied **9** · Skipped **3** · Drift **1** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `S_word_count_below_band` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (61b → 100b) |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ✅ applied | replaced single occurrence (111b → 153b) |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (88b → 137b) |
| `H_judge_point_of_view_vs_both-sides` | apply_patch | ✅ applied | replaced single occurrence (196b → 136b) |
| `H_judge_quotable_sentences` | apply_patch | ✅ applied | replaced single occurrence (81b → 108b) |
| `Q_specificity` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Costs can spir… |
| `P_faq_count_mismatch` | attempt_rewrite | ✅ applied | FAQPage rebuilt from 9 visible FAQ(s) |
| `S_tldr_missing` | attempt_rewrite | ✅ applied | TL;DR inserted (315 chars) |
| `D_Person_missing_recommended` | insert_missing | ➖ skipped | no patch envelope |
| `S_h2_question_ratio_low` | attempt_rewrite | ✅ applied | converted 2 H2(s) to question form (6/14 = 43%) |
| `S_visible_last_updated_missing` | attempt_rewrite | ✅ applied | last-updated stamp inserted (2026-04-23) |
| `E_author_credentials_missing` | attempt_rewrite | 🔔 escalated | author.title and author.bio both absent in brief — caller must populate |

## 🔔 Open items as of this version

- **E_author_sameas_missing** (critical) → needs: `author.linkedin_url`
  - Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- **E_human_signals_bundle_incomplete** (critical) → needs: `author`, `first_party_data`, `named_examples`, `original_visuals`
  - Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-flag risk
- **E_no_first_party_data** (fail) → needs: `first_party_data`
  - no patch/before to rewrite

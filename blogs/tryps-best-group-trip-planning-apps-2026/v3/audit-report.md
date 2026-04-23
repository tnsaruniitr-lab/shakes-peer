# v3 — Audit Report

**Score:** 52/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 1 &nbsp;·&nbsp; **Cost:** $0.1694

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 22 |
| Humanization | 72 |
| Quality | 60 |
| **Overall** | **52** |

## Compared to previous version

7 fixed · 10 still present · 0 regressed

### ✅ Fixed
- `S_tldr_missing` (was fail)
- `S_visible_last_updated_missing` (was warn)
- `H_judge_specific_human_voice` (was fail)
- `H_judge_genuine_opinions` (was fail)
- `H_judge_point_of_view` (was warn)
- `H_judge_quotable_sentence` (was fail)
- `Q_intro_hook` (was warn)

### ⚠️ Still present
- `D_Person_missing_recommended` (warn)
- `P_faq_count_mismatch` (fail)
- `S_word_count_below_band` (fail)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `H_tricolon_density` (warn)
- `H_judge_unexpected_phrasings` (warn)
- `H_judge_specific_citations` (warn)
- `H_judge_intro_earns_attention` (warn)
- `Q_specificity` (warn)

## Findings at this version (17)

### 🔴 critical (1)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)

### 🟠 fail (2)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~14 FAQ pairs
- `S_word_count_below_band` — 1033 words is below comparison minimum 1200 (target 1800)

### 🟡 warn (14)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `D_entity_missing_id` — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `S_tldr_word_count` — TL;DR is 60 words (target 40–58)
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_em_dash_overuse` — 5 em-dashes (1.37 per 400 words; target <1)
- `H_tricolon_density` — 10 tricolons (3.41/500 words; target ≤2)
- `H_judge_specific_human_voice_vs_committee` — Specific human voice vs committee 5/10 — Has flashes of voice (the Dave/Doodle line, group chat dying) but mostly reads like marketing copy…
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 6/10 — The Wanderlog concession in the conclusion is genuine; most other claims are defensive product posit…
- `H_judge_unexpected_phrasings` — Unexpected phrasings 6/10 — The 'Dave ghosting the Doodle poll' and 'thumbs-up emoji three days later' lines are fresh; rest is stock compa…
- `H_judge_specific_citations` — Specific citations 6/10 — Only one concrete price ($29.99/year Wanderlog Pro) and a date. Competitor pricing, user counts, and specific fea…
- `H_judge_quotable_sentences` — Quotable sentences 6/10 — The Dave/Doodle line is genuinely quotable; most other sentences are feature-list prose.
- `H_judge_intro_earns_attention` — Intro earns attention 4/10 — Opens with duplicated navigation cruft and a bland TL;DR before any hook lands.
- `Q_answer_extractability` — answer_extractability 5/10 — The primary keyword demands a clean, extractable answer stating which app wins and why, ideally within the fir…
- `Q_specificity` — specificity 6/10 — This sentence references data without naming a single number, date range, percentage, or search term — it is pure abstra…

## What we did this round

Applied **7** · Skipped **5** · Drift **8** · Ambiguous **0** · Escalated **2** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `S_word_count_below_band` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `S_tldr_word_count` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_em_dash_overuse` | apply_patch | ✅ applied | replaced single occurrence (477b → 476b) |
| `H_em_dash_overuse` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=em-dash-remova… |
| `H_em_dash_overuse` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=em-dash-remova… |
| `H_tricolon_density` | attempt_rewrite | ✅ applied | rewrote 672b → 699b |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_judge_specific_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (110b → 114b) |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ✅ applied | replaced single occurrence (83b → 120b) |
| `H_judge_unexpected_phrasings` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=If you're the … |
| `H_judge_specific_citations` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_quotable_sentences` | apply_patch | ✅ applied | replaced single occurrence (138b → 89b) |
| `H_judge_intro_earns_attention` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Blog Trip Plan… |
| `Q_answer_extractability` | apply_patch | ✅ applied | replaced single occurrence (261b → 321b) |
| `Q_specificity` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Google's trave… |
| `P_faq_count_mismatch` | attempt_rewrite | ✅ applied | FAQPage rebuilt from 7 visible FAQ(s) |
| `D_Person_missing_recommended` | insert_missing | ➖ skipped | no patch envelope |
| `D_entity_missing_id` | insert_missing | ➖ skipped | no patch envelope |
| `E_author_credentials_missing` | attempt_rewrite | 🔔 escalated | author.title and author.bio both absent in brief — caller must populate |

## 🔔 Open items as of this version

- **E_author_sameas_missing** (critical) → needs: `author.linkedin_url`
  - Author has no sameAs URLs (should link LinkedIn + at least one other profile)

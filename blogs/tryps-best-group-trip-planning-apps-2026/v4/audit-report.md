# v4 — Audit Report

**Score:** 53/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 1 &nbsp;·&nbsp; **Cost:** $0.1710

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 22 |
| Humanization | 75 |
| Quality | 63 |
| **Overall** | **53** |

## Compared to previous version

4 fixed · 13 still present · 0 regressed

### ✅ Fixed
- `H_em_dash_overuse` (was warn)
- `H_judge_specific_citations` (was warn)
- `H_judge_quotable_sentences` (was warn)
- `Q_answer_extractability` (was warn)

### ⚠️ Still present
- `D_Person_missing_recommended` (warn)
- `D_entity_missing_id` (warn)
- `P_faq_count_mismatch` (fail)
- `S_tldr_word_count` (warn)
- `S_word_count_below_band` (fail)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `H_tricolon_density` (warn)
- `H_judge_specific_human_voice_vs_committee` (warn)
- `H_judge_genuine_opinions_vs_safe_claims` (warn)
- `H_judge_unexpected_phrasings` (warn)
- `H_judge_intro_earns_attention` (warn)
- `Q_specificity` (warn)

## Findings at this version (15)

### 🔴 critical (1)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)

### 🟠 fail (2)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~14 FAQ pairs
- `S_word_count_below_band` — 1033 words is below comparison minimum 1200 (target 1800)

### 🟡 warn (12)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `D_entity_missing_id` — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `S_tldr_word_count` — TL;DR is 72 words (target 40–58)
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_tricolon_density` — 10 tricolons (3.38/500 words; target ≤2)
- `H_judge_specific_human_voice_vs_committee` — Specific human voice vs committee 5/10 — Some personality peeks through (the Dave/Doodle line), but most of the piece reverts to marketing-…
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 6/10 — The Wanderlog road-trip concession and 'Dave ghosting' show real takes, but most comparisons read li…
- `H_judge_unexpected_phrasings` — Unexpected phrasings 6/10 — A few fresh lines (thumbs-up emoji three days late, group chat dying on trip four) are outnumbered by boilerpla…
- `H_judge_quotability` — Quotability 6/10 — The Dave/Doodle and group-chat-on-trip-four lines are quotable; most other sentences aren't.
- `H_judge_intro_earns_attention` — Intro earns attention 4/10 — The opening is a duplicated nav crumb plus a generic TL;DR; the real hook (Dave ghosting Doodle) is buried par…
- `Q_intro_hook` — intro_hook 6/10 — The TL;DR and quick-answer block front-load value, but the nominal 'hook' — the first two sentences a reader hits before …
- `Q_specificity` — specificity 5/10 — The post names the right apps and gives one concrete price ($29.99/year for Wanderlog Pro), but repeatedly invokes '[goo…

## What we did this round

Applied **7** · Skipped **4** · Drift **5** · Ambiguous **0** · Escalated **2** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `S_word_count_below_band` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `S_tldr_word_count` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_tricolon_density` | attempt_rewrite | ✅ applied | rewrote 699b → 706b |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_judge_specific_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (102b → 94b) |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ✅ applied | replaced single occurrence (59b → 104b) |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (126b → 140b) |
| `H_judge_quotability` | apply_patch | ✅ applied | replaced single occurrence (61b → 100b) |
| `H_judge_intro_earns_attention` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Blog Trip Plan… |
| `Q_intro_hook` | apply_patch | ✅ applied | replaced single occurrence (104b → 241b) |
| `Q_specificity` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Google's trave… |
| `P_faq_count_mismatch` | attempt_rewrite | ✅ applied | FAQPage rebuilt from 7 visible FAQ(s) |
| `D_Person_missing_recommended` | insert_missing | ➖ skipped | no patch envelope |
| `D_entity_missing_id` | insert_missing | ➖ skipped | no patch envelope |
| `E_author_credentials_missing` | attempt_rewrite | 🔔 escalated | author.title and author.bio both absent in brief — caller must populate |

## 🔔 Open items as of this version

- **E_author_sameas_missing** (critical) → needs: `author.linkedin_url`
  - Author has no sameAs URLs (should link LinkedIn + at least one other profile)

# v3 — Audit Report

**Score:** 41/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1580

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 58 |
| Quality | 73 |
| **Overall** | **41** |

## Compared to previous version

9 fixed · 12 still present · 0 regressed

### ✅ Fixed
- `S_tldr_missing` (was fail)
- `S_h2_question_ratio_low` (was warn)
- `S_visible_last_updated_missing` (was warn)
- `S_missing_DefinedTerm_schema` (was fail)
- `H_judge_specific_citations` (was warn)
- `H_judge_point_of_view_vs_survey` (was fail)
- `H_judge_quotable_sentence` (was fail)
- `H_judge_intro_earns_attention` (was fail)
- `Q_specificity` (was warn)

### ⚠️ Still present
- `D_Person_missing_recommended` (warn)
- `P_faq_count_mismatch` (fail)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `E_no_first_party_data` (fail)
- `E_human_signals_bundle_incomplete` (critical)
- `H_tricolon_density` (warn)
- `H_banned_vocabulary` (fail)
- `H_passive_overuse` (warn)
- `H_judge_human_voice_vs_committee` (warn)
- `H_judge_genuine_opinions_vs_safe_claims` (warn)
- `H_judge_unexpected_phrasings` (warn)

## Findings at this version (18)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (4)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~14 FAQ pairs
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_banned_vocabulary` — AI-signature vocabulary present: robust(1)
- `H_judge_intro_earns_attention_in_2_sentences` — Intro earns attention in 2 sentences 3/10 — Opens with navigation crumbs, repeated titles, dateline, and a textbook definition—nothing earn…

### 🟡 warn (12)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `D_entity_missing_id` — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_em_dash_overuse` — 7 em-dashes (2.29 per 400 words; target <1)
- `H_tricolon_density` — 10 tricolons (4.09/500 words; target ≤2)
- `H_passive_overuse` — Passive-voice ratio 22% (target <15%)
- `H_judge_human_voice_vs_committee` — Human voice vs committee 4/10 — Mostly committee-voice boilerplate, with occasional first-person flashes that feel bolted on.
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 6/10 — A few sharp takes (E-E-A-T is theater, most AEO advice is garbage) exist but are surrounded by hedge…
- `H_judge_unexpected_phrasings` — Unexpected phrasings 5/10 — Two or three memorable lines, but most prose is tri-colon AI cadence ("structuring, clarifying, and validating"…
- `H_judge_point_of_view_vs_both-sides_survey` — Point of view vs both-sides survey 5/10 — Has a POV in flashes but defaults to neutral explainer-comparison mode.
- `H_judge_quotable_to_a_friend` — Quotable to a friend 6/10 — "The winners in AEO aren't the loudest—they're the most quotable" and the E-E-A-T line are genuinely quotable; …
- `Q_intro_hook` — intro_hook 6/10 — The TL;DR block is strong, but the actual body intro opens with a dry definition that repeats what the TL;DR already said…

## What we did this round

Applied **8** · Skipped **6** · Drift **11** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_banned_vocabulary` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_intro_earns_attention_in_2_sentences` | apply_patch | ✅ applied | replaced single occurrence (221b → 138b) |
| `H_em_dash_overuse` | apply_patch | ✅ applied | replaced single occurrence (551b → 552b) |
| `H_em_dash_overuse` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=em-dash-remova… |
| `H_em_dash_overuse` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=em-dash-remova… |
| `H_em_dash_overuse` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=em-dash-remova… |
| `H_em_dash_overuse` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=em-dash-remova… |
| `H_tricolon_density` | attempt_rewrite | ✅ applied | rewrote 344b → 388b |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_passive_overuse` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_passive_overuse` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_passive_overuse` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_passive_overuse` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_judge_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (224b → 146b) |
| `H_judge_genuine_opinions_vs_safe_claims` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (115b → 74b) |
| `H_judge_point_of_view_vs_both-sides_survey` | apply_patch | ✅ applied | replaced single occurrence (121b → 86b) |
| `H_judge_quotable_to_a_friend` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `Q_intro_hook` | apply_patch | ✅ applied | drift recovered via fuzzy whitespace match |
| `P_faq_count_mismatch` | attempt_rewrite | ✅ applied | FAQPage rebuilt from 7 visible FAQ(s) |
| `D_Person_missing_recommended` | insert_missing | ➖ skipped | no patch envelope |
| `D_entity_missing_id` | insert_missing | ➖ skipped | no patch envelope |
| `E_author_credentials_missing` | attempt_rewrite | 🔔 escalated | author.title and author.bio both absent in brief — caller must populate |

## 🔔 Open items as of this version

- **E_author_sameas_missing** (critical) → needs: `author.linkedin_url`
  - Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- **E_human_signals_bundle_incomplete** (critical) → needs: `author`, `first_party_data`, `named_examples`, `original_visuals`
  - Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-flag risk
- **E_no_first_party_data** (fail) → needs: `first_party_data`
  - no patch/before to rewrite

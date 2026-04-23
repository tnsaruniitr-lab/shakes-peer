# v3 — Audit Report

**Score:** 44/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1941

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 71 |
| Quality | 63 |
| **Overall** | **44** |

## Compared to previous version

5 fixed · 12 still present · 0 regressed

### ✅ Fixed
- `S_tldr_missing` (was fail)
- `S_visible_last_updated_missing` (was warn)
- `H_judge_specific_citations` (was warn)
- `H_judge_point_of_view_vs_balanced_survey` (was warn)
- `H_judge_quotable_sentence` (was fail)

### ⚠️ Still present
- `D_Person_missing_recommended` (warn)
- `M_description_length` (warn)
- `P_faq_count_mismatch` (fail)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `E_no_first_party_data` (fail)
- `E_human_signals_bundle_incomplete` (critical)
- `H_judge_specific_human_voice_vs_committee` (fail)
- `H_judge_genuine_opinions_vs_safe_claims` (warn)
- `H_judge_unexpected_phrasings` (warn)
- `H_judge_intro_earns_attention` (fail)
- `Q_intro_hook` (warn)

## Findings at this version (17)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (4)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~14 FAQ pairs
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_judge_specific_human_voice_vs_committee` — Specific human voice vs committee 3/10 — Reads like branded editorial content written by consensus, with stock phrases like 'evidence-backe…
- `H_judge_intro_earns_attention` — Intro earns attention 3/10 — Opens with navigation crumbs, TL;DR, byline, and a vague claim before the genuinely hooky 64% statistic buried…

### 🟡 warn (11)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `D_entity_missing_id` — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `M_description_length` — Meta description length 107 (target 110–170)
- `S_tldr_word_count` — TL;DR is 61 words (target 40–58)
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 4/10 — Mostly safe, hedged claims. A couple of opinionated lines exist ('anyone telling you to grind...is s…
- `H_judge_unexpected_phrasings` — Unexpected phrasings 5/10 — Mostly predictable corporate-wellness phrasing, though 'Your willpower expires in February; your calendar doesn…
- `H_judge_point_of_view_vs_neutral_survey` — Point of view vs neutral survey 5/10 — Has flashes of POV but defaults to balanced, disclaimer-laden coverage typical of brand health conte…
- `H_judge_quotable_sentences` — Quotable sentences 6/10 — 'Your willpower expires in February; your calendar doesn't' is quotable. Most other lines are forgettable policy …
- `Q_intro_hook` — intro_hook 6/10 — The TL;DR block and 'Quick answer' section front-load good material, but by the time the actual body prose begins, the fi…
- `Q_specificity` — specificity 5/10 — An editorial instruction ('Cite the lead author...') was accidentally published as body copy, which is a critical specif…

## What we did this round

Applied **7** · Skipped **6** · Drift **1** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_specific_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (161b → 178b) |
| `H_judge_intro_earns_attention` | apply_patch | ✅ applied | replaced single occurrence (101b → 123b) |
| `M_description_length` | edit_schema | ➖ skipped | no patch envelope |
| `S_tldr_word_count` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ✅ applied | drift recovered via fuzzy whitespace match |
| `H_judge_unexpected_phrasings` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=This article d… |
| `H_judge_point_of_view_vs_neutral_survey` | apply_patch | ✅ applied | replaced single occurrence (124b → 113b) |
| `H_judge_quotable_sentences` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `Q_intro_hook` | apply_patch | ✅ applied | replaced single occurrence (234b → 272b) |
| `Q_specificity` | apply_patch | ✅ applied | replaced single occurrence (130b → 196b) |
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

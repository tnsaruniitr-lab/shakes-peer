# v3 — Audit Report

**Score:** 47/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1721

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 71 |
| Quality | 73 |
| **Overall** | **47** |

## Compared to previous version

6 fixed · 10 still present · 0 regressed

### ✅ Fixed
- `S_tldr_missing` (was fail)
- `S_visible_last_updated_missing` (was warn)
- `H_judge_unexpected_phrasing` (was fail)
- `H_judge_specific_citations` (was warn)
- `H_judge_point_of_view` (was fail)
- `H_judge_quotable_sentence` (was fail)

### ⚠️ Still present
- `D_Person_missing_recommended` (warn)
- `P_faq_count_mismatch` (fail)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `E_no_first_party_data` (fail)
- `E_human_signals_bundle_incomplete` (critical)
- `H_judge_specific_human_voice_vs_committee` (fail)
- `H_judge_genuine_opinions_vs_safe_claims` (warn)
- `H_judge_intro_earns_attention` (fail)
- `Q_specificity` (warn)

## Findings at this version (15)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (4)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~13 FAQ pairs
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_judge_specific_human_voice_vs_committee` — Specific human voice vs committee 3/10 — Reads as corporate marketing copy with interchangeable editorial byline.
- `H_judge_intro_earns_attention` — Intro earns attention 3/10 — Opens with a TL;DR block and generic framing rather than a hook.

### 🟡 warn (9)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `D_entity_missing_id` — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `S_tldr_word_count` — TL;DR is 61 words (target 40–58)
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 4/10 — Has one or two opinionated lines but mostly hedges behind guidelines.
- `H_judge_unexpected_phrasings` — Unexpected phrasings 5/10 — A few fresh lines ('swap tactics, not self-worth') but mostly predictable wellness phrasing.
- `H_judge_point_of_view_vs_survey` — Point of view vs survey 5/10 — Scattered POV moments but FAQ and body mostly summarise guidelines neutrally.
- `H_judge_quotability` — Quotability 6/10 — 'Swap tactics, not self-worth' and 'failed A/B test, not a character flaw' are quotable; most other lines aren't.
- `Q_specificity` — specificity 6/10 — The post has good pockets of specificity (AED prices, 50/25/25 plate split, khubz, taraweeh) but repeatedly lapses into …

## What we did this round

Applied **7** · Skipped **4** · Drift **1** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_specific_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (139b → 109b) |
| `H_judge_intro_earns_attention` | apply_patch | ✅ applied | replaced single occurrence (193b → 169b) |
| `S_tldr_word_count` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ✅ applied | replaced single occurrence (139b → 101b) |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (118b → 121b) |
| `H_judge_point_of_view_vs_survey` | apply_patch | ✅ applied | replaced single occurrence (136b → 150b) |
| `H_judge_quotability` | apply_patch | ✅ applied | replaced single occurrence (144b → 51b) |
| `Q_specificity` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Checking your … |
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

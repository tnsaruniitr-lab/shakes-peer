# v3 — Audit Report

**Score:** 48/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.2049

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 77 |
| Quality | 70 |
| **Overall** | **48** |

## Compared to previous version

7 fixed · 9 still present · 0 regressed

### ✅ Fixed
- `S_tldr_missing` (was fail)
- `S_h2_question_ratio_low` (was warn)
- `S_visible_last_updated_missing` (was warn)
- `H_judge_human_voice_vs_committee` (was warn)
- `H_judge_genuine_opinions_vs_safe_claims` (was warn)
- `H_judge_point_of_view_vs_both-sides` (was warn)
- `Q_specificity` (was warn)

### ⚠️ Still present
- `D_Person_missing_recommended` (warn)
- `P_faq_count_mismatch` (fail)
- `S_word_count_below_band` (fail)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `E_no_first_party_data` (fail)
- `E_human_signals_bundle_incomplete` (critical)
- `H_judge_unexpected_phrasings` (warn)
- `H_judge_quotable_sentences` (warn)

## Findings at this version (14)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (3)
- `P_faq_count_mismatch` — FAQPage schema has 9 Questions but page shows ~17 FAQ pairs
- `S_word_count_below_band` — 1345 words is below pillar minimum 1900 (target 2500)
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation

### 🟡 warn (9)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `D_entity_missing_id` — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_judge_specific_human_voice` — Specific human voice 5/10 — Has flashes of personality but mostly reads as branded editorial template with 'TRYPS Editorial' byline.
- `H_judge_genuine_opinions` — Genuine opinions 6/10 — Some opinions surface (Pig and the Lady 'non-negotiable'), but many claims stay safe and brochure-like.
- `H_judge_unexpected_phrasings` — Unexpected phrasings 6/10 — A few fresh bits ('who's on aux,' 'group chat explodes') mixed with generic travel-blog cadence.
- `H_judge_quotable_sentences` — Quotable sentences 5/10 — A couple of lines have snap ('who's on aux'), but most sentences are functional not memorable.
- `H_judge_intro_earns_attention` — Intro earns attention 4/10 — Opens with duplicated breadcrumb metadata and a TL;DR before the actual hook; the real opener is buried.
- `Q_answer_extractability` — answer_extractability 5/10 — The primary keyword answer is fragmented across multiple sections and buried beneath structural headers like '…

## What we did this round

Applied **5** · Skipped **4** · Drift **2** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `S_word_count_below_band` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_specific_human_voice` | apply_patch | ✅ applied | replaced single occurrence (100b → 108b) |
| `H_judge_genuine_opinions` | apply_patch | ✅ applied | replaced single occurrence (63b → 115b) |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (103b → 95b) |
| `H_judge_quotable_sentences` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Costs can spir… |
| `H_judge_intro_earns_attention` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Blog Trip Plan… |
| `Q_answer_extractability` | apply_patch | ✅ applied | replaced single occurrence (78b → 458b) |
| `P_faq_count_mismatch` | attempt_rewrite | ✅ applied | FAQPage rebuilt from 9 visible FAQ(s) |
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

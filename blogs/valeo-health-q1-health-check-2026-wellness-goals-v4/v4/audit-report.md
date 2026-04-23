# v4 — Audit Report

**Score:** 49/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1603

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 78 |
| Quality | 73 |
| **Overall** | **49** |

## Compared to previous version

5 fixed · 10 still present · 0 regressed

### ✅ Fixed
- `H_judge_specific_human_voice_vs_committee` (was warn)
- `H_judge_genuine_opinions_vs_safe_claims` (was warn)
- `H_judge_point_of_view_vs_survey` (was warn)
- `H_judge_quotable_sentence` (was warn)
- `Q_intro_hook` (was warn)

### ⚠️ Still present
- `D_Person_missing_recommended` (warn)
- `D_entity_missing_id` (warn)
- `P_faq_count_mismatch` (fail)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `E_no_first_party_data` (fail)
- `E_human_signals_bundle_incomplete` (critical)
- `H_judge_unexpected_phrasings` (warn)
- `H_judge_intro_earns_attention` (warn)
- `Q_specificity` (warn)

## Findings at this version (12)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (2)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~13 FAQ pairs
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation

### 🟡 warn (8)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `D_entity_missing_id` — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_judge_specific_human_voice` — Specific human voice 5/10 — Flashes of voice ('desert humbles every calendar') fight with committee-written framing sentences.
- `H_judge_unexpected_phrasings` — Unexpected phrasings 6/10 — Some vivid lines ('quietly rotting through spring') but diluted by generic SEO boilerplate.
- `H_judge_specific_citations` — Specific citations 6/10 — Has a date (19 March 2026), price (AED 1,200), named bodies (DHA, MOHAP), but few specific names, clinics, or cas…
- `H_judge_intro_earns_attention` — Intro earns attention 4/10 — The strong hook exists but is buried under TL;DR, bylines, and repeated boilerplate before the reader gets to …
- `Q_specificity` — specificity 6/10 — The post has strong specificity in places (AED 1,200, March 19 date, named tests like fasting glucose and lipid panel, D…

## What we did this round

Applied **3** · Skipped **4** · Drift **2** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_specific_human_voice` | apply_patch | ✅ applied | replaced single occurrence (221b → 160b) |
| `H_judge_unexpected_phrasings` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=This guide off… |
| `H_judge_specific_citations` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_intro_earns_attention` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=TL;DR: A Q1 he… |
| `Q_specificity` | apply_patch | ✅ applied | replaced single occurrence (108b → 174b) |
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

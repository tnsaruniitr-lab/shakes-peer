# v4 — Audit Report

**Score:** 45/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1559

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 69 |
| Quality | 70 |
| **Overall** | **45** |

## Compared to previous version

2 fixed · 13 still present · 0 regressed

### ✅ Fixed
- `H_judge_genuine_opinions_vs_safe_claims` (was warn)
- `H_judge_point_of_view_vs_both-sides_survey` (was warn)

### ⚠️ Still present
- `D_Person_missing_recommended` (warn)
- `D_entity_missing_id` (warn)
- `P_faq_count_mismatch` (fail)
- `S_tldr_keyword_position` (warn)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `E_no_first_party_data` (fail)
- `E_human_signals_bundle_incomplete` (critical)
- `H_banned_vocabulary` (fail)
- `H_judge_specific_human_voice_vs_committee` (warn)
- `H_judge_unexpected_phrasings` (warn)
- `H_judge_intro_earns_attention` (warn)
- `Q_specificity` (warn)

## Findings at this version (15)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (3)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~13 FAQ pairs
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_banned_vocabulary` — AI-signature vocabulary present: cornerstone(1), foster(1)

### 🟡 warn (10)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `D_entity_missing_id` — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `S_tldr_keyword_position` — Primary keyword "q1 health check" not in first 8 words of TL;DR
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_em_dash_overuse` — 7 em-dashes (2.16 per 400 words; target <1)
- `H_judge_specific_human_voice_vs_committee` — Specific human voice vs committee 6/10 — Mix of sharp personal asides and generic SEO filler; the voice wavers between a real GP and a cont…
- `H_judge_unexpected_phrasings` — Unexpected phrasings 6/10 — Some vivid lines (45°C car park, January-self vs July-self) sit next to heavy boilerplate phrases.
- `H_judge_quotable_sentences` — Quotable sentences 6/10 — A few quotable zingers exist, but they're buried among flat clinical summaries nobody would repeat.
- `H_judge_intro_earns_attention` — Intro earns attention 4/10 — Opens with a definitional TL;DR and duplicated title; the strong GP line is buried several sentences down.
- `Q_specificity` — specificity 6/10 — The post has strong specificity in places (AED 650 panel, 48-hour results, 45°C car park, 1.5–2L water) but repeatedly c…

## What we did this round

Applied **5** · Skipped **5** · Drift **4** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_banned_vocabulary` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `S_tldr_keyword_position` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_em_dash_overuse` | apply_patch | ✅ applied | replaced single occurrence (356b → 355b) |
| `H_em_dash_overuse` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=em-dash-remova… |
| `H_em_dash_overuse` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=em-dash-remova… |
| `H_judge_specific_human_voice_vs_committee` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=By focusing on… |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (211b → 140b) |
| `H_judge_quotable_sentences` | apply_patch | ✅ applied | replaced single occurrence (63b → 78b) |
| `H_judge_intro_earns_attention` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=TL;DR: A Q1 20… |
| `Q_specificity` | apply_patch | ✅ applied | replaced single occurrence (67b → 201b) |
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

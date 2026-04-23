# v3 — Audit Report

**Score:** 46/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1631

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 71 |
| Quality | 70 |
| **Overall** | **46** |

## Compared to previous version

6 fixed · 12 still present · 0 regressed

### ✅ Fixed
- `S_tldr_missing` (was fail)
- `S_visible_last_updated_missing` (was warn)
- `H_judge_specific_citations_(names,_places,_price` (was warn)
- `H_judge_point_of_view_vs_neutral_survey` (was fail)
- `H_judge_quotable_sentence` (was fail)
- `Q_intro_hook` (was warn)

### ⚠️ Still present
- `D_Person_missing_recommended` (warn)
- `P_faq_count_mismatch` (fail)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `E_no_first_party_data` (fail)
- `E_human_signals_bundle_incomplete` (critical)
- `H_banned_vocabulary` (fail)
- `H_judge_specific_human_voice_vs_committee` (warn)
- `H_judge_genuine_opinions_vs_safe_claims` (warn)
- `H_judge_unexpected_phrasings` (warn)
- `H_judge_intro_earns_attention` (fail)
- `Q_specificity` (warn)

## Findings at this version (15)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (4)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~13 FAQ pairs
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_banned_vocabulary` — AI-signature vocabulary present: cornerstone(1), foster(1)
- `H_judge_intro_earns_attention` — Intro earns attention 3/10 — Opens with duplicated H1, a bureaucratic TL;DR, and a meta description before the human hook appears.

### 🟡 warn (9)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `D_entity_missing_id` — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `S_tldr_keyword_position` — Primary keyword "q1 health check" not in first 8 words of TL;DR
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_judge_specific_human_voice_vs_committee` — Specific human voice vs committee 5/10 — Voice oscillates between a believable GP persona and generic SEO listicle boilerplate.
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 6/10 — A few sharp opinions (ignoring WHO, Ramadan killing resolutions) sit beside many hedged platitudes.
- `H_judge_unexpected_phrasings` — Unexpected phrasings 6/10 — '45°C car park' and 'January self had no idea Ramadan was coming' are vivid; most other phrasing is stock.
- `H_judge_point_of_view_vs_both-sides_survey` — Point of view vs both-sides survey 6/10 — Has a POV (anti-WHO, pro-March review) but dilutes it with neutral 'friendly note' filler.
- `Q_specificity` — specificity 6/10 — Several bullet points and transition sentences float in abstractions ('small, useful adjustments', 'longer-lasting healt…

## What we did this round

Applied **5** · Skipped **5** · Drift **2** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_banned_vocabulary` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_intro_earns_attention` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=TL;DR: A Q1 20… |
| `S_tldr_keyword_position` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_specific_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (77b → 118b) |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ✅ applied | replaced single occurrence (84b → 139b) |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (177b → 96b) |
| `H_judge_point_of_view_vs_both-sides_survey` | apply_patch | ✅ applied | replaced single occurrence (102b → 97b) |
| `Q_specificity` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Quarterly revi… |
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

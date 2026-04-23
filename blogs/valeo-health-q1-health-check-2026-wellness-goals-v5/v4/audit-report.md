# v4 — Audit Report

**Score:** 47/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1826

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 75 |
| Quality | 67 |
| **Overall** | **47** |

## Compared to previous version

3 fixed · 14 still present · 0 regressed

### ✅ Fixed
- `H_judge_point_of_view_vs_neutral_survey` (was warn)
- `Q_intro_hook` (was warn)
- `Q_specificity` (was warn)

### ⚠️ Still present
- `D_Person_missing_recommended` (warn)
- `D_entity_missing_id` (warn)
- `M_description_length` (warn)
- `P_faq_count_mismatch` (fail)
- `S_tldr_word_count` (warn)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `E_no_first_party_data` (fail)
- `E_human_signals_bundle_incomplete` (critical)
- `H_judge_specific_human_voice_vs_committee` (fail)
- `H_judge_genuine_opinions_vs_safe_claims` (warn)
- `H_judge_unexpected_phrasings` (warn)
- `H_judge_quotable_sentences` (warn)
- `H_judge_intro_earns_attention` (warn)

## Findings at this version (16)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (3)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~14 FAQ pairs
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_judge_specific_human_voice_vs_committee` — Specific human voice vs committee 3/10 — Reads like a content marketing team output with repeated 'Friendly note' scaffolding and branded p…

### 🟡 warn (11)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `D_entity_missing_id` — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `M_description_length` — Meta description length 107 (target 110–170)
- `S_tldr_word_count` — TL;DR is 61 words (target 40–58)
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 5/10 — A few opinionated lines exist ('anyone telling you to grind...is selling something') but most conten…
- `H_judge_unexpected_phrasings` — Unexpected phrasings 5/10 — 'Your willpower expires in February; your calendar doesn't' is sharp, but most prose is predictable wellness-sp…
- `H_judge_point_of_view_vs_both-sides_survey` — Point of view vs both-sides survey 6/10 — Has some POV ('Skip the coaching upsell') but mostly presents as neutral guidance.
- `H_judge_quotable_sentences` — Quotable sentences 6/10 — One or two quotable lines exist, but they're buried under conventional prose.
- `H_judge_intro_earns_attention` — Intro earns attention 6/10 — The '64% quietly quit' hook is strong, but it's immediately diluted by boilerplate second sentence and duplica…
- `Q_answer_extractability` — answer_extractability 5/10 — The 'Quick answer' section exists but is split across two paragraphs, mixes passive voice, and buries the mech…

## What we did this round

Applied **4** · Skipped **6** · Drift **3** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_specific_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (161b → 164b) |
| `M_description_length` | edit_schema | ➖ skipped | no patch envelope |
| `S_tldr_word_count` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ✅ applied | replaced single occurrence (122b → 119b) |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (76b → 109b) |
| `H_judge_point_of_view_vs_both-sides_survey` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=This article d… |
| `H_judge_quotable_sentences` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_intro_earns_attention` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=This evidence-… |
| `Q_answer_extractability` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Instead of wai… |
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

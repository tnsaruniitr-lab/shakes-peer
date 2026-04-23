# v4 — Audit Report

**Score:** 50/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1975

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 76 |
| Quality | 80 |
| **Overall** | **50** |

## Compared to previous version

2 fixed · 12 still present · 0 regressed

### ✅ Fixed
- `H_judge_quotable_sentences` (was warn)
- `Q_answer_extractability` (was warn)

### ⚠️ Still present
- `D_Person_missing_recommended` (warn)
- `D_entity_missing_id` (warn)
- `P_faq_count_mismatch` (fail)
- `S_word_count_below_band` (fail)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `E_no_first_party_data` (fail)
- `E_human_signals_bundle_incomplete` (critical)
- `H_judge_specific_human_voice` (warn)
- `H_judge_genuine_opinions` (warn)
- `H_judge_unexpected_phrasings` (warn)
- `H_judge_intro_earns_attention` (warn)

## Findings at this version (15)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (3)
- `P_faq_count_mismatch` — FAQPage schema has 9 Questions but page shows ~16 FAQ pairs
- `S_word_count_below_band` — 1345 words is below pillar minimum 1900 (target 2500)
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation

### 🟡 warn (10)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `D_entity_missing_id` — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `S_h2_question_ratio_low` — 5/14 H2s are questions (36% — target ≥40%)
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_judge_specific_human_voice` — Specific human voice 4/10 — Reads like a committee-produced SEO template with editorial byline and formulaic structure.
- `H_judge_genuine_opinions` — Genuine opinions 6/10 — Has a few real takes (Duke's is touristy but worth it, Pig and the Lady non-negotiable) but mostly safe recommendat…
- `H_judge_unexpected_phrasings` — Unexpected phrasings 5/10 — Some decent phrases ('who's on aux', 'war zone') but mostly predictable travel-blog cadence.
- `H_judge_point_of_view` — Point of view 6/10 — Has POV in spots but frequently devolves into surveying all options equally.
- `H_judge_quotable_sentence` — Quotable sentence 5/10 — 'Not all Oahu itineraries survive the group chat' is quotable, but most sentences are utilitarian.
- `H_judge_intro_earns_attention` — Intro earns attention 5/10 — Buried under duplicated title, metadata, and TL;DR before the actual hook lands.

## What we did this round

Applied **5** · Skipped **6** · Drift **1** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `S_word_count_below_band` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_specific_human_voice` | apply_patch | ✅ applied | replaced single occurrence (44b → 114b) |
| `H_judge_genuine_opinions` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (151b → 110b) |
| `H_judge_point_of_view` | apply_patch | ✅ applied | replaced single occurrence (160b → 102b) |
| `H_judge_quotable_sentence` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_intro_earns_attention` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Blog Trip Plan… |
| `P_faq_count_mismatch` | attempt_rewrite | ✅ applied | FAQPage rebuilt from 9 visible FAQ(s) |
| `D_Person_missing_recommended` | insert_missing | ➖ skipped | no patch envelope |
| `D_entity_missing_id` | insert_missing | ➖ skipped | no patch envelope |
| `S_h2_question_ratio_low` | attempt_rewrite | ✅ applied | converted 1 H2(s) to question form (6/14 = 43%) |
| `E_author_credentials_missing` | attempt_rewrite | 🔔 escalated | author.title and author.bio both absent in brief — caller must populate |

## 🔔 Open items as of this version

- **E_author_sameas_missing** (critical) → needs: `author.linkedin_url`
  - Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- **E_human_signals_bundle_incomplete** (critical) → needs: `author`, `first_party_data`, `named_examples`, `original_visuals`
  - Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-flag risk
- **E_no_first_party_data** (fail) → needs: `first_party_data`
  - no patch/before to rewrite

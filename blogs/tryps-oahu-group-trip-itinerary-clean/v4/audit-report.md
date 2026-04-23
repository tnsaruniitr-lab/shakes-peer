# v4 — Audit Report

**Score:** 46/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 3 &nbsp;·&nbsp; **Cost:** $0.2022

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 66 |
| Quality | 80 |
| **Overall** | **46** |

## Compared to previous version

3 fixed · 16 still present · 0 regressed

### ✅ Fixed
- `H_judge_point_of_view_vs_both-sides` (was warn)
- `H_judge_quotable_sentences` (was warn)
- `Q_specificity` (was warn)

### ⚠️ Still present
- `V_schema_invalid_json` (critical)
- `D_Person_missing_recommended` (warn)
- `D_entity_missing_id` (warn)
- `P_faq_count_mismatch` (fail)
- `S_tldr_word_count` (warn)
- `S_toc_missing` (warn)
- `S_word_count_below_band` (fail)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `E_no_first_party_data` (fail)
- `E_human_signals_bundle_incomplete` (critical)
- `H_banned_phrases` (fail)
- `H_judge_specific_human_voice_vs_committee` (warn)
- `H_judge_genuine_opinions_vs_safe_claims` (warn)
- `H_judge_unexpected_phrasings` (warn)
- `H_judge_intro_earns_attention` (fail)

## Findings at this version (18)

### 🔴 critical (3)
- `V_schema_invalid_json` — JSON-LD block #1 failed to parse: Bad control character in string literal in JSON at position 7863 (line 224 column 51). Downstream schema …
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (5)
- `P_faq_count_mismatch` — FAQPage schema has 10 Questions but page shows ~19 FAQ pairs
- `S_word_count_below_band` — 1593 words is below pillar minimum 1900 (target 2500)
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_banned_phrases` — AI-signature phrases present (1): the key to success is
- `H_judge_intro_earns_attention` — Intro earns attention 3/10 — Opens with meta-chrome (TL;DR, byline, date, read-time) before any hook; actual hook is buried paragraphs down.

### 🟡 warn (10)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `D_entity_missing_id` — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `S_tldr_word_count` — TL;DR is 70 words (target 40–58)
- `S_toc_missing` — Post is 1593 words (pillar) — include a <nav aria-label="Table of contents"> for LLM outline extraction
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_judge_specific_human_voice_vs_committee` — Specific human voice vs committee 4/10 — Reads like marketing copy with TL;DR, Key takeaways, FAQ scaffolding; occasional first-person flas…
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 5/10 — Some real takes (rentals beat hotels, Rainbow Drive-In) but mostly hedged, evenhanded advice.
- `H_judge_unexpected_phrasings` — Unexpected phrasings 5/10 — "Herding cats," "hangry mutinies," "sane, sunburned" show some life, but most sentences are travel-blog boilerp…
- `H_judge_point_of_view_vs_survey` — Point of view vs survey 5/10 — Picks a lane on rentals vs hotels, but most sections survey options neutrally.
- `H_judge_quotable_sentence` — Quotable sentence 4/10 — The "screenshot of Duke's Waikiki" line is genuinely quotable; most others are functional.

## What we did this round

Applied **4** · Skipped **8** · Drift **2** · Ambiguous **0** · Escalated **4** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `V_schema_invalid_json` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `S_word_count_below_band` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_banned_phrases` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_intro_earns_attention` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=TL;DR: A solid… |
| `S_tldr_word_count` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `S_toc_missing` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_specific_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (276b → 232b) |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ✅ applied | replaced single occurrence (115b → 163b) |
| `H_judge_unexpected_phrasings` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_point_of_view_vs_survey` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Waikiki: easy … |
| `H_judge_quotable_sentence` | apply_patch | ✅ applied | replaced single occurrence (82b → 108b) |
| `P_faq_count_mismatch` | attempt_rewrite | ✅ applied | FAQPage rebuilt from 10 visible FAQ(s) |
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
- **V_schema_invalid_json** (critical)
  - JSON-LD block #1 failed to parse: Bad control character in string literal in JSON at position 7864 (line 224 column 52). Downstream schema checks cannot run on…

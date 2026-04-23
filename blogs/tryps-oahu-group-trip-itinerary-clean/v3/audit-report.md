# v3 — Audit Report

**Score:** 45/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 3 &nbsp;·&nbsp; **Cost:** $0.1960

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 68 |
| Quality | 70 |
| **Overall** | **45** |

## Compared to previous version

3 fixed · 13 still present · 0 regressed

### ✅ Fixed
- `S_tldr_missing` (was fail)
- `S_visible_last_updated_missing` (was warn)
- `H_judge_point_of_view_vs_both-sides_survey` (was warn)

### ⚠️ Still present
- `D_Person_missing_recommended` (warn)
- `P_faq_count_mismatch` (fail)
- `S_toc_missing` (warn)
- `S_word_count_below_band` (fail)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `E_no_first_party_data` (fail)
- `E_human_signals_bundle_incomplete` (critical)
- `H_judge_specific_human_voice_vs_committee` (warn)
- `H_judge_genuine_opinions_vs_safe_claims` (warn)
- `H_judge_unexpected_phrasings` (warn)
- `H_judge_quotable_sentences` (warn)
- `H_judge_intro_earns_attention` (fail)

## Findings at this version (19)

### 🔴 critical (3)
- `V_schema_invalid_json` — JSON-LD block #1 failed to parse: Bad control character in string literal in JSON at position 7864 (line 224 column 52). Downstream schema …
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (5)
- `P_faq_count_mismatch` — FAQPage schema has 10 Questions but page shows ~19 FAQ pairs
- `S_word_count_below_band` — 1593 words is below pillar minimum 1900 (target 2500)
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_banned_phrases` — AI-signature phrases present (1): the key to success is
- `H_judge_intro_earns_attention` — Intro earns attention 3/10 — Buried under metadata, TL;DR, bylines, and a 'Quick answer' before the actual hook lands.

### 🟡 warn (11)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `D_entity_missing_id` — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `S_tldr_word_count` — TL;DR is 70 words (target 40–58)
- `S_toc_missing` — Post is 1593 words (pillar) — include a <nav aria-label="Table of contents"> for LLM outline extraction
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_judge_specific_human_voice_vs_committee` — Specific human voice vs committee 4/10 — Has a voice in flashes ('herding cats') but is mostly editorial boilerplate; a stray editing instr…
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 5/10 — Some opinions surface (rentals beat hotels, skip certain things) but most claims are generic travel-…
- `H_judge_unexpected_phrasings` — Unexpected phrasings 6/10 — A few decent lines (herding cats, hangry mutinies, plate lunch for the plane), but surrounded by predictable tr…
- `H_judge_point_of_view_vs_both-sides` — Point of view vs both-sides 6/10 — Has a mild POV but the FAQ and comparison sections hedge into neutral surveying.
- `H_judge_quotable_sentences` — Quotable sentences 5/10 — The group-chat opening and plate-lunch closer are quotable; most of the body isn't.
- `Q_specificity` — specificity 6/10 — The cost section uses ranges and categories correctly, but the framing sentence is pure throat-clearing abstraction ('no…

## What we did this round

Applied **6** · Skipped **8** · Drift **1** · Ambiguous **0** · Escalated **4** · Failed **0**

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
| `H_judge_specific_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (126b → 124b) |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ✅ applied | replaced single occurrence (115b → 161b) |
| `H_judge_unexpected_phrasings` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_point_of_view_vs_both-sides` | apply_patch | ✅ applied | replaced single occurrence (174b → 165b) |
| `H_judge_quotable_sentences` | apply_patch | ✅ applied | replaced single occurrence (276b → 230b) |
| `Q_specificity` | apply_patch | ✅ applied | replaced single occurrence (117b → 264b) |
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

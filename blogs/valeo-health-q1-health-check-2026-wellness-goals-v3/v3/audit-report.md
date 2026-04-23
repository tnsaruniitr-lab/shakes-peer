# v3 — Audit Report

**Score:** 49/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1724

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 74 |
| Quality | 77 |
| **Overall** | **49** |

## Compared to previous version

6 fixed · 11 still present · 0 regressed

### ✅ Fixed
- `S_tldr_missing` (was fail)
- `S_visible_last_updated_missing` (was warn)
- `H_judge_human_voice_vs_committee` (was fail)
- `H_judge_specific_citations` (was warn)
- `H_judge_point_of_view` (was fail)
- `Q_specificity` (was warn)

### ⚠️ Still present
- `D_Person_missing_recommended` (warn)
- `P_faq_count_mismatch` (fail)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `E_no_first_party_data` (fail)
- `E_human_signals_bundle_incomplete` (critical)
- `H_low_burstiness` (warn)
- `H_judge_genuine_opinions_vs_safe_claims` (warn)
- `H_judge_unexpected_phrasings` (warn)
- `H_judge_quotable_sentence` (warn)
- `H_judge_intro_earns_attention` (warn)

## Findings at this version (14)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (2)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~14 FAQ pairs
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation

### 🟡 warn (10)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `D_entity_missing_id` — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_low_burstiness` — Sentence-length burstiness 0.53 (target ≥0.55) — rhythm too uniform
- `H_judge_specific_human_voice_vs_committee` — Specific human voice vs committee 4/10 — Mostly corporate/editorial voice with occasional human flashes (the '78 days' line, the 'theatre' …
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 6/10 — Has two genuinely opinionated lines (Ramadan/theatre, mental-health framing), but much of it is hedg…
- `H_judge_unexpected_phrasings` — Unexpected phrasings 5/10 — The 78-day/iftar line and '45°C August' are fresh, but most copy is predictable wellness phrasing.
- `H_judge_point_of_view_vs_survey` — Point of view vs survey 6/10 — Has POV moments but frequently retreats into neutral authority-citing.
- `H_judge_quotable_sentence` — Quotable sentence 6/10 — The '78 days to first iftar' line and 'fewer March collapses, fewer guilty July restarts' are quotable; rest is fo…
- `H_judge_intro_earns_attention` — Intro earns attention 5/10 — Opening is generic; the strong '78 days' hook is buried three paragraphs down.

## What we did this round

Applied **6** · Skipped **5** · Drift **0** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_low_burstiness` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_specific_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (187b → 137b) |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ✅ applied | replaced single occurrence (83b → 115b) |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (81b → 100b) |
| `H_judge_point_of_view_vs_survey` | apply_patch | ✅ applied | replaced single occurrence (158b → 117b) |
| `H_judge_quotable_sentence` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_intro_earns_attention` | apply_patch | ✅ applied | replaced single occurrence (111b → 165b) |
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

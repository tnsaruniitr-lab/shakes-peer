# v3 — Audit Report

**Score:** 50/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 3 &nbsp;·&nbsp; **Cost:** $0.1833

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 76 |
| Quality | 80 |
| **Overall** | **50** |

## Compared to previous version

5 fixed · 9 still present · 1 regressed

### ✅ Fixed
- `S_tldr_missing` (was fail)
- `S_visible_last_updated_missing` (was warn)
- `H_judge_specific_human_voice_vs_committee` (was warn)
- `H_judge_genuine_opinions_vs_safe_claims` (was warn)
- `H_judge_quotable_sentence` (was warn)

### ⚠️ Still present
- `D_Person_missing_recommended` (warn)
- `P_faq_count_mismatch` (fail)
- `S_toc_missing` (warn)
- `S_word_count_below_band` (fail)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `E_no_first_party_data` (fail)
- `E_human_signals_bundle_incomplete` (critical)
- `H_judge_unexpected_phrasings` (warn)

### 🔴 Regressed
- `H_judge_intro_earns_attention` (warn → fail)

## Findings at this version (15)

### 🔴 critical (3)
- `V_schema_invalid_json` — JSON-LD block #1 failed to parse: Bad control character in string literal in JSON at position 7793 (line 224 column 30). Downstream schema …
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (4)
- `P_faq_count_mismatch` — FAQPage schema has 10 Questions but page shows ~19 FAQ pairs
- `S_word_count_below_band` — 1737 words is below pillar minimum 1900 (target 2500)
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_judge_intro_earns_attention` — Intro earns attention 3/10 — Opens with duplicated breadcrumb navigation and a bland TL;DR instead of a hook.

### 🟡 warn (8)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `D_entity_missing_id` — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `S_toc_missing` — Post is 1737 words (pillar) — include a <nav aria-label="Table of contents"> for LLM outline extraction
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_judge_sounds_like_a_specific_human` — Sounds like a specific human 4/10 — Mixes a casual voice with committee-speak phrases like 'decision fatigue' and 'coordination failures' t…
- `H_judge_genuine_opinions` — Genuine opinions 6/10 — Has some real takes (skip Hanauma Bay if unbooked, rentals beat hotels at 4+) but hedges often.
- `H_judge_unexpected_phrasings` — Unexpected phrasings 5/10 — A few fresh lines ('unpaid travel agent', 'your most indecisive friend won't argue with malasadas') but many ge…
- `H_judge_quotable_to_a_friend` — Quotable to a friend 5/10 — The 'unpaid travel agent' line is quotable; most sentences are too functional to share.

## What we did this round

Applied **4** · Skipped **6** · Drift **1** · Ambiguous **0** · Escalated **4** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `V_schema_invalid_json` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `S_word_count_below_band` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_intro_earns_attention` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Blog Trip Plan… |
| `S_toc_missing` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_sounds_like_a_specific_human` | apply_patch | ✅ applied | replaced single occurrence (155b → 117b) |
| `H_judge_genuine_opinions` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (54b → 81b) |
| `H_judge_quotable_to_a_friend` | apply_patch | ✅ applied | replaced single occurrence (101b → 112b) |
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
  - JSON-LD block #1 failed to parse: Bad control character in string literal in JSON at position 7793 (line 224 column 30). Downstream schema checks cannot run on…

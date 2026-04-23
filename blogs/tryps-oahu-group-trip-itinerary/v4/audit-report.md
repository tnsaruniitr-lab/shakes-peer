# v4 — Audit Report

**Score:** 49/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 3 &nbsp;·&nbsp; **Cost:** $0.1996

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 76 |
| Quality | 73 |
| **Overall** | **49** |

## Compared to previous version

2 fixed · 14 still present · 0 regressed

### ✅ Fixed
- `H_judge_specific_human_voice` (was warn)
- `H_judge_genuine_opinions` (was warn)

### ⚠️ Still present
- `V_schema_invalid_json` (critical)
- `D_Person_missing_recommended` (warn)
- `D_entity_missing_id` (warn)
- `P_faq_count_mismatch` (fail)
- `S_tldr_keyword_position` (warn)
- `S_toc_missing` (warn)
- `S_word_count_below_band` (fail)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `E_no_first_party_data` (fail)
- `E_human_signals_bundle_incomplete` (critical)
- `H_judge_unexpected_phrasings` (warn)
- `H_judge_quotable_sentences` (warn)
- `H_judge_intro_earns_attention` (fail)

## Findings at this version (17)

### 🔴 critical (3)
- `V_schema_invalid_json` — JSON-LD block #1 failed to parse: Bad control character in string literal in JSON at position 7830 (line 224 column 31). Downstream schema …
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (4)
- `P_faq_count_mismatch` — FAQPage schema has 10 Questions but page shows ~18 FAQ pairs
- `S_word_count_below_band` — 1505 words is below pillar minimum 1900 (target 2500)
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_judge_intro_earns_attention` — Intro earns attention 3/10 — Opens with duplicated breadcrumbs, a TL;DR, and a leaked editorial instruction before any actual hook.

### 🟡 warn (10)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `D_entity_missing_id` — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `S_tldr_keyword_position` — Primary keyword "oahu group trip itinerary" not in first 8 words of TL;DR
- `S_toc_missing` — Post is 1505 words (pillar) — include a <nav aria-label="Table of contents"> for LLM outline extraction
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_judge_specific_human_voice_vs_committee` — Specific human voice vs committee 4/10 — Contains leaked AI prompt instructions and shifts between voices; the 'write in first person' line…
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 6/10 — Has some opinions (skip culture day one) but many FAQ answers are bland and hedged.
- `H_judge_unexpected_phrasings` — Unexpected phrasings 6/10 — Some fresh lines ('one organiser, seven opinions, 1000 unread messages') but mixed with generic travel-blog fil…
- `H_judge_quotable_sentences` — Quotable sentences 5/10 — A few quotable moments but many ruined by comma splices and awkward phrasing.
- `Q_intro_hook` — intro_hook 6/10 — The post buries its best sentence ('There's a specific moment on every group trip when someone suggests Hanauma Bay...') …

## What we did this round

Applied **2** · Skipped **6** · Drift **4** · Ambiguous **1** · Escalated **4** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `V_schema_invalid_json` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `S_word_count_below_band` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_intro_earns_attention` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Blog Trip Plan… |
| `S_tldr_keyword_position` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `S_toc_missing` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_specific_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (120b → 151b) |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ⚠️ ambiguous | before string matches 3 locations — refusing to blind-replace |
| `H_judge_unexpected_phrasings` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Coordinating f… |
| `H_judge_quotable_sentences` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Friend groups … |
| `Q_intro_hook` | apply_patch | ↩️ drift | before string not found in html (patch type=rewrite_intro, target=Coordinating … |
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
  - JSON-LD block #1 failed to parse: Bad control character in string literal in JSON at position 7831 (line 224 column 32). Downstream schema checks cannot run on…

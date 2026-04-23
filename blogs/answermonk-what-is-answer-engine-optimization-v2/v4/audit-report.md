# v4 — Audit Report

**Score:** 46/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1491

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 68 |
| Quality | 77 |
| **Overall** | **46** |

## Compared to previous version

4 fixed · 12 still present · 0 regressed

### ✅ Fixed
- `H_judge_human_voice_vs_committee` (was fail)
- `H_judge_quotability` (was warn)
- `H_judge_intro_hook` (was fail)
- `Q_specificity` (was warn)

### ⚠️ Still present
- `D_Person_missing_recommended` (warn)
- `D_entity_missing_id` (warn)
- `M_description_length` (warn)
- `P_faq_count_mismatch` (fail)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `E_no_first_party_data` (fail)
- `E_human_signals_bundle_incomplete` (critical)
- `H_tricolon_density` (warn)
- `H_judge_genuine_opinions` (warn)
- `H_judge_unexpected_phrasings` (warn)
- `H_judge_point_of_view` (warn)

## Findings at this version (16)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (3)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~14 FAQ pairs
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_judge_intro_earns_attention` — Intro earns attention 3/10 — Opens with stacked metadata, TL;DR, and generic definitions before any hook lands.

### 🟡 warn (11)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `D_entity_missing_id` — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `M_description_length` — Meta description length 97 (target 110–170)
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_tricolon_density` — 9 tricolons (3.53/500 words; target ≤2)
- `H_low_burstiness` — Sentence-length burstiness 0.55 (target ≥0.55) — rhythm too uniform
- `H_judge_specific_human_voice` — Specific human voice 4/10 — Mostly committee-sounding boilerplate with occasional flashes of voice (vending machine line, 'number worth ste…
- `H_judge_genuine_opinions` — Genuine opinions 6/10 — A few real opinions appear (schema is overhyped, most AEO advice is repackaged SEO) but they're buried between safe…
- `H_judge_unexpected_phrasings` — Unexpected phrasings 5/10 — Two memorable metaphors (vending machine, publicist) surrounded by filler phrasing.
- `H_judge_point_of_view` — Point of view 5/10 — Largely surveys both sides; only the conclusion and a couple of asides commit to a stance.
- `H_judge_quotable_sentence` — Quotable sentence 6/10 — The 'vending machines' line and 'number worth stealing' are quotable; most sentences aren't.

## What we did this round

Applied **5** · Skipped **7** · Drift **5** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_intro_earns_attention` | apply_patch | ✅ applied | replaced single occurrence (150b → 143b) |
| `M_description_length` | edit_schema | ➖ skipped | no patch envelope |
| `H_tricolon_density` | attempt_rewrite | ✅ applied | rewrote 265b → 269b |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_low_burstiness` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_specific_human_voice` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Industry resea… |
| `H_judge_genuine_opinions` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (93b → 128b) |
| `H_judge_point_of_view` | apply_patch | ✅ applied | replaced single occurrence (213b → 140b) |
| `H_judge_quotable_sentence` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
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

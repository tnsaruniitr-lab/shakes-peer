# v3 — Audit Report

**Score:** 45/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1709

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 66 |
| Quality | 73 |
| **Overall** | **45** |

## Compared to previous version

9 fixed · 11 still present · 0 regressed

### ✅ Fixed
- `S_tldr_missing` (was fail)
- `S_visible_last_updated_missing` (was warn)
- `S_missing_DefinedTerm_schema` (was fail)
- `H_judge_genuine_opinions_vs_safe_claims` (was fail)
- `H_judge_specific_citations_(names/prices/dates)` (was warn)
- `H_judge_point_of_view_vs_neutral_survey` (was fail)
- `H_judge_quotable_sentence` (was fail)
- `H_judge_intro_earns_attention` (was fail)
- `Q_intro_hook` (was warn)

### ⚠️ Still present
- `D_Person_missing_recommended` (warn)
- `M_description_length` (warn)
- `P_faq_count_mismatch` (fail)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `E_no_first_party_data` (fail)
- `E_human_signals_bundle_incomplete` (critical)
- `H_tricolon_density` (warn)
- `H_judge_human_voice_vs_committee` (fail)
- `H_judge_unexpected_phrasings` (warn)
- `Q_specificity` (warn)

## Findings at this version (16)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (4)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~14 FAQ pairs
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_judge_human_voice_vs_committee` — Human voice vs committee 3/10 — Reads like a template with repetitive definitional scaffolding; same phrasing recurs across sections.
- `H_judge_intro_hook` — Intro hook 3/10 — Opens with a boilerplate definition and TL;DR stack; nothing pulls the reader into sentence three.

### 🟡 warn (10)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `D_entity_missing_id` — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `M_description_length` — Meta description length 97 (target 110–170)
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_tricolon_density` — 10 tricolons (3.89/500 words; target ≤2)
- `H_judge_genuine_opinions` — Genuine opinions 4/10 — Only the conclusion offers a real take; the body plays it safe with consensus claims.
- `H_judge_unexpected_phrasings` — Unexpected phrasings 4/10 — Mostly predictable marketing phrasing; the 'number a model can steal' line is the only standout.
- `H_judge_point_of_view` — Point of view 4/10 — Survey-style answers throughout; a clear stance only appears in the final conclusion.
- `H_judge_quotability` — Quotability 5/10 — One quotable line ('a number a model can steal'); the rest is forgettable definitional prose.
- `Q_specificity` — specificity 6/10 — The post contains good specificity islands — Profound ($499/mo), Semrush's Jan 2025 launch, the 68% figure, DefinedTerm …

## What we did this round

Applied **8** · Skipped **4** · Drift **5** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (230b → 116b) |
| `H_judge_intro_hook` | apply_patch | ✅ applied | replaced single occurrence (150b → 159b) |
| `M_description_length` | edit_schema | ➖ skipped | no patch envelope |
| `H_tricolon_density` | attempt_rewrite | ✅ applied | rewrote 246b → 265b |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_judge_genuine_opinions` | apply_patch | ✅ applied | replaced single occurrence (144b → 124b) |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (139b → 112b) |
| `H_judge_point_of_view` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Is AEO just an… |
| `H_judge_quotability` | apply_patch | ✅ applied | replaced single occurrence (124b → 109b) |
| `Q_specificity` | apply_patch | ✅ applied | replaced single occurrence (170b → 259b) |
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

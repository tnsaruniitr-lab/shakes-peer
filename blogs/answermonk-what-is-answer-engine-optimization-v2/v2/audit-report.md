# v2 — Audit Report

**Score:** 35/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1671

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 52 |
| Quality | 57 |
| **Overall** | **35** |

## Findings at this version (20)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (10)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~14 FAQ pairs
- `S_tldr_missing` — No TL;DR block (expected <p data-tldr> or paragraph starting with 'TL;DR:')
- `S_missing_DefinedTerm_schema` — definitional posts should have DefinedTerm schema — not present
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_judge_human_voice_vs_committee` — Human voice vs committee 1/10 — Reads entirely like templated marketing copy with no personality.
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 1/10 — Every claim is a safe, hedged generality with no stance.
- `H_judge_unexpected_phrasings` — Unexpected phrasings 1/10 — Language is stock phrases: 'path to success', 'stay ahead', 'data-driven'.
- `H_judge_point_of_view_vs_neutral_survey` — Point of view vs neutral survey 2/10 — Presents both sides of every question without committing.
- `H_judge_quotable_sentence` — Quotable sentence 1/10 — Nothing memorable; all sentences are interchangeable definitions.
- `H_judge_intro_earns_attention` — Intro earns attention 2/10 — Opens with a definition and buzzword soup, no hook or specificity.

### 🟡 warn (8)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `M_description_length` — Meta description length 97 (target 110–170)
- `S_visible_last_updated_missing` — No visible 'Last updated' / 'Last reviewed' / 'Next review' stamp on page (schema dateModified alone isn't enough for users or AI)
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_tricolon_density` — 10 tricolons (4.05/500 words; target ≤2)
- `H_judge_specific_citations_(names/prices/dates)` — Specific citations (names/prices/dates) 4/10 — Cites a few engines and one arXiv paper, but no prices, people, dates, or concrete examples.
- `Q_intro_hook` — intro_hook 5/10 — The post opens with a definition restatement immediately after the meta description already gave the same definition. The…
- `Q_specificity` — specificity 4/10 — The post repeatedly gestures at 'industry research,' 'academic frameworks,' and 'in-depth guidance' without ever surfaci…

## What we did this round

Applied **12** · Skipped **3** · Drift **6** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (198b → 107b) |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ✅ applied | replaced single occurrence (113b → 129b) |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (202b → 107b) |
| `H_judge_point_of_view_vs_neutral_survey` | apply_patch | ✅ applied | replaced single occurrence (213b → 161b) |
| `H_judge_quotable_sentence` | apply_patch | ✅ applied | replaced single occurrence (82b → 83b) |
| `H_judge_intro_earns_attention` | apply_patch | ✅ applied | replaced single occurrence (150b → 152b) |
| `M_description_length` | edit_schema | ➖ skipped | no patch envelope |
| `H_tricolon_density` | attempt_rewrite | ✅ applied | rewrote 244b → 246b |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_judge_specific_citations_(names/prices/dates)` | apply_patch | ✅ applied | replaced single occurrence (145b → 149b) |
| `Q_intro_hook` | apply_patch | ↩️ drift | before string not found in html (patch type=rewrite_intro, target=Answer engine… |
| `Q_specificity` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Industry resea… |
| `P_faq_count_mismatch` | attempt_rewrite | ✅ applied | FAQPage rebuilt from 7 visible FAQ(s) |
| `S_tldr_missing` | attempt_rewrite | ✅ applied | TL;DR inserted (413 chars) |
| `S_missing_DefinedTerm_schema` | insert_missing | ✅ applied | DefinedTerm 'answer engine optimization' appended |
| `D_Person_missing_recommended` | insert_missing | ➖ skipped | no patch envelope |
| `S_visible_last_updated_missing` | attempt_rewrite | ✅ applied | last-updated stamp inserted (2026-04-23) |
| `E_author_credentials_missing` | attempt_rewrite | 🔔 escalated | author.title and author.bio both absent in brief — caller must populate |

## 🔔 Open items as of this version

- **E_author_sameas_missing** (critical) → needs: `author.linkedin_url`
  - Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- **E_human_signals_bundle_incomplete** (critical) → needs: `author`, `first_party_data`, `named_examples`, `original_visuals`
  - Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-flag risk
- **E_no_first_party_data** (fail) → needs: `first_party_data`
  - no patch/before to rewrite

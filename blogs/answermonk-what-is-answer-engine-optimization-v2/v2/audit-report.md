# v2 — Audit Report

**Score:** 35/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1713

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 43 |
| Quality | 70 |
| **Overall** | **35** |

## Findings at this version (21)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (11)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~12 FAQ pairs
- `S_tldr_missing` — No TL;DR block (expected <p data-tldr> or paragraph starting with 'TL;DR:')
- `S_missing_DefinedTerm_schema` — definitional posts should have DefinedTerm schema — not present
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_banned_vocabulary` — AI-signature vocabulary present: robust(1)
- `H_judge_human_voice_vs_committee` — Human voice vs committee 2/10 — Reads like a corporate content template with no personality or individual perspective.
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 1/10 — Every claim is a defensible platitude; no risk-taking or contrarian stance.
- `H_judge_unexpected_phrasings` — Unexpected phrasings 1/10 — Entirely predictable phrasing; 'discipline of optimizing,' 'citation share,' 'authority signals' are AI boilerp…
- `H_judge_point_of_view_vs_survey` — Point of view vs survey 2/10 — Takes no position; hedges every assertion with safe qualifiers.
- `H_judge_quotable_sentence` — Quotable sentence 1/10 — Nothing memorable; every sentence is interchangeable generic SaaS blog prose.
- `H_judge_intro_earns_attention` — Intro earns attention 2/10 — Opens with a dictionary definition, the most predictable possible hook.

### 🟡 warn (8)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `S_h2_question_ratio_low` — 4/13 H2s are questions (31% — target ≥40%)
- `S_visible_last_updated_missing` — No visible 'Last updated' / 'Last reviewed' / 'Next review' stamp on page (schema dateModified alone isn't enough for users or AI)
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_tricolon_density` — 14 tricolons (5.94/500 words; target ≤2)
- `H_passive_overuse` — Passive-voice ratio 31% (target <15%)
- `H_judge_specific_citations` — Specific citations 4/10 — Names platforms but gives no prices, dates, percentages, study results, or people—just bracketed placeholder refs.
- `Q_specificity` — specificity 5/10 — The post names tools and schema types well, but several sentences float in abstractions — 'authority,' 'visibility,' 're…

## What we did this round

Applied **14** · Skipped **3** · Drift **9** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_banned_vocabulary` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (149b → 142b) |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ✅ applied | replaced single occurrence (122b → 139b) |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (244b → 110b) |
| `H_judge_point_of_view_vs_survey` | apply_patch | ✅ applied | replaced single occurrence (100b → 124b) |
| `H_judge_quotable_sentence` | apply_patch | ✅ applied | replaced single occurrence (174b → 109b) |
| `H_judge_intro_earns_attention` | apply_patch | ✅ applied | replaced single occurrence (221b → 164b) |
| `H_tricolon_density` | attempt_rewrite | ✅ applied | rewrote 310b → 311b |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_passive_overuse` | attempt_rewrite | ✅ applied | rewrote 276b → 279b |
| `H_passive_overuse` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_passive_overuse` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_passive_overuse` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_passive_overuse` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_judge_specific_citations` | apply_patch | ✅ applied | replaced single occurrence (155b → 148b) |
| `Q_specificity` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Organizations … |
| `P_faq_count_mismatch` | attempt_rewrite | ✅ applied | FAQPage rebuilt from 7 visible FAQ(s) |
| `S_tldr_missing` | attempt_rewrite | ✅ applied | TL;DR inserted (347 chars) |
| `S_missing_DefinedTerm_schema` | insert_missing | ✅ applied | DefinedTerm 'answer engine optimization' appended |
| `D_Person_missing_recommended` | insert_missing | ➖ skipped | no patch envelope |
| `S_h2_question_ratio_low` | attempt_rewrite | ✅ applied | converted 2 H2(s) to question form (6/13 = 46%) |
| `S_visible_last_updated_missing` | attempt_rewrite | ✅ applied | last-updated stamp inserted (2026-04-23) |
| `E_author_credentials_missing` | attempt_rewrite | 🔔 escalated | author.title and author.bio both absent in brief — caller must populate |

## 🔔 Open items as of this version

- **E_author_sameas_missing** (critical) → needs: `author.linkedin_url`
  - Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- **E_human_signals_bundle_incomplete** (critical) → needs: `author`, `first_party_data`, `named_examples`, `original_visuals`
  - Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-flag risk
- **E_no_first_party_data** (fail) → needs: `first_party_data`
  - no patch/before to rewrite

# v2 — Audit Report

**Score:** 34/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1662

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 48 |
| Quality | 60 |
| **Overall** | **34** |

## Findings at this version (22)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (11)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~13 FAQ pairs
- `S_tldr_missing` — No TL;DR block (expected <p data-tldr> or paragraph starting with 'TL;DR:')
- `S_missing_DefinedTerm_schema` — definitional posts should have DefinedTerm schema — not present
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_judge_specific_human_voice_vs_committee` — Specific human voice vs committee 1/10 — Reads as templated marketing content with no individual perspective.
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 1/10 — Every claim is hedged, generic, and safely sourced without any stance.
- `H_judge_unexpected_phrasings` — Unexpected phrasings 1/10 — Entirely predictable marketing phrasing with no surprise.
- `H_judge_specific_citations_(names,_prices,_dates` — Specific citations (names, prices, dates) 3/10 — Names engines and one schema type but lacks concrete numbers, prices, or dated findings.
- `H_judge_point_of_view_vs_neutral_survey` — Point of view vs neutral survey 2/10 — Presents balanced explainer without taking a side.
- `H_judge_quotability` — Quotability 1/10 — No line has memorable phrasing worth sharing.
- `H_judge_intro_earns_attention` — Intro earns attention 2/10 — Opens with definitional filler and a meta-description of the article.

### 🟡 warn (9)
- `D_WebSite_missing_recommended` — WebSite missing recommended: potentialAction
- `D_ImageObject_missing_recommended` — ImageObject missing recommended: creator, license
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, url, hasCredential
- `S_visible_last_updated_missing` — No visible 'Last updated' / 'Last reviewed' / 'Next review' stamp on page (schema dateModified alone isn't enough for users or AI)
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_em_dash_overuse` — 5 em-dashes (1.49 per 400 words; target <1)
- `H_tricolon_density` — 15 tricolons (5.60/500 words; target ≤2)
- `Q_intro_hook` — intro_hook 5/10 — The first sentence is a serviceable definition but not a hook — it states the topic rather than creating urgency or surpr…
- `Q_specificity` — specificity 5/10 — The post names the right platforms and schema types, which is good. But several key claims float in abstraction: 'indust…

## What we did this round

Applied **11** · Skipped **5** · Drift **7** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `P_faq_count_mismatch` | attempt_rewrite | ✅ applied | FAQPage rebuilt from 7 visible FAQ(s) |
| `S_tldr_missing` | attempt_rewrite | ✅ applied | TL;DR inserted (367 chars) |
| `S_missing_DefinedTerm_schema` | insert_missing | ✅ applied | DefinedTerm 'answer engine optimization' appended |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_specific_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (74b → 132b) |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ✅ applied | replaced single occurrence (51b → 134b) |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (88b → 126b) |
| `H_judge_specific_citations_(names,_prices,_dates` | apply_patch | ✅ applied | replaced single occurrence (109b → 130b) |
| `H_judge_point_of_view_vs_neutral_survey` | apply_patch | ✅ applied | replaced single occurrence (79b → 136b) |
| `H_judge_quotability` | apply_patch | ✅ applied | replaced single occurrence (97b → 109b) |
| `H_judge_intro_earns_attention` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=This article d… |
| `D_WebSite_missing_recommended` | insert_missing | ➖ skipped | no patch envelope |
| `D_ImageObject_missing_recommended` | insert_missing | ➖ skipped | no patch envelope |
| `D_Person_missing_recommended` | insert_missing | ➖ skipped | no patch envelope |
| `S_visible_last_updated_missing` | attempt_rewrite | ✅ applied | last-updated stamp inserted (2026-04-23) |
| `E_author_credentials_missing` | attempt_rewrite | 🔔 escalated | author.title and author.bio both absent in brief — caller must populate |
| `H_em_dash_overuse` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_tricolon_density` | attempt_rewrite | ✅ applied | rewrote 298b → 356b |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `Q_intro_hook` | apply_patch | ↩️ drift | before string not found in html (patch type=rewrite_intro, target=This article … |
| `Q_specificity` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Industry analy… |

## 🔔 Open items as of this version

- **E_author_sameas_missing** (critical) → needs: `author.linkedin_url`
  - Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- **E_human_signals_bundle_incomplete** (critical) → needs: `author`, `first_party_data`, `named_examples`, `original_visuals`
  - Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-flag risk
- **E_no_first_party_data** (fail) → needs: `first_party_data`
  - no patch/before to rewrite

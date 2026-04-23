# v2 — Audit Report

**Score:** 37/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1818

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 47 |
| Quality | 73 |
| **Overall** | **37** |

## Findings at this version (20)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (11)
- `P_faq_count_mismatch` — FAQPage schema has 8 Questions but page shows ~15 FAQ pairs
- `S_tldr_missing` — No TL;DR block (expected <p data-tldr> or paragraph starting with 'TL;DR:')
- `S_missing_DefinedTerm_schema` — definitional posts should have DefinedTerm schema — not present
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_judge_human_voice_vs_committee` — Human voice vs committee 1/10 — Reads like a template filled in by a content generator; no individual voice anywhere.
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 1/10 — Every claim is hedged, generic, and uncontroversial; no stake in the ground.
- `H_judge_unexpected_phrasing` — Unexpected phrasing 1/10 — Phrasing is entirely predictable AI boilerplate: 'discipline of', 'intent fulfillment', 'citation-worthy signals…
- `H_judge_specific_citations_(names/places/prices/` — Specific citations (names/places/prices/dates) 3/10 — Names engines and vague references but no actual numbers, studies, people, prices, or…
- `H_judge_point_of_view_vs_both-sides_survey` — Point of view vs both-sides survey 2/10 — Surveys every angle neutrally without taking a position.
- `H_judge_quotability` — Quotability 1/10 — Not a single line has the sharpness or surprise you'd text to a colleague.
- `H_judge_intro_earns_attention` — Intro earns attention 1/10 — Opens with a dictionary definition stacked on a second dictionary definition; zero hook.

### 🟡 warn (7)
- `D_Organization_missing_recommended` — Organization missing recommended: logo, sameAs, contactPoint
- `D_WebPage_missing_recommended` — WebPage missing recommended: dateModified, isPartOf, primaryImageOfPage, inLanguage
- `S_visible_last_updated_missing` — No visible 'Last updated' / 'Last reviewed' / 'Next review' stamp on page (schema dateModified alone isn't enough for users or AI)
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_em_dash_overuse` — 15 em-dashes (4.38 per 400 words; target <1)
- `H_tricolon_density` — 21 tricolons (7.67/500 words; target ≤2)
- `Q_specificity` — specificity 6/10 — The section on brand visibility factors recycles the same trio of signals (schema, evidence, authority) used in every ot…

## What we did this round

Applied **11** · Skipped **3** · Drift **1** · Ambiguous **2** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `P_faq_count_mismatch` | attempt_rewrite | ✅ applied | FAQPage rebuilt from 8 visible FAQ(s) |
| `S_tldr_missing` | attempt_rewrite | ✅ applied | TL;DR inserted (364 chars) |
| `S_missing_DefinedTerm_schema` | insert_missing | ✅ applied | DefinedTerm 'answer engine optimization' appended |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_human_voice_vs_committee` | apply_patch | ⚠️ ambiguous | before string matches 2 locations — refusing to blind-replace |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ✅ applied | replaced single occurrence (100b → 119b) |
| `H_judge_unexpected_phrasing` | apply_patch | ✅ applied | replaced single occurrence (97b → 101b) |
| `H_judge_specific_citations_(names/places/prices/` | apply_patch | ✅ applied | replaced single occurrence (113b → 144b) |
| `H_judge_point_of_view_vs_both-sides_survey` | apply_patch | ✅ applied | replaced single occurrence (156b → 117b) |
| `H_judge_quotability` | apply_patch | ✅ applied | replaced single occurrence (127b → 113b) |
| `H_judge_intro_earns_attention` | apply_patch | ⚠️ ambiguous | before string matches 2 locations — refusing to blind-replace |
| `D_Organization_missing_recommended` | insert_missing | ✅ applied | Organization enriched |
| `D_WebPage_missing_recommended` | insert_missing | ✅ applied | WebPage enriched |
| `S_visible_last_updated_missing` | attempt_rewrite | ✅ applied | last-updated stamp inserted (2026-04-23) |
| `E_author_credentials_missing` | attempt_rewrite | 🔔 escalated | author.title and author.bio both absent in brief — caller must populate |
| `H_em_dash_overuse` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_tricolon_density` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `Q_specificity` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Which Factors … |

## 🔔 Open items as of this version

- **E_author_sameas_missing** (critical) → needs: `author.linkedin_url`
  - Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- **E_human_signals_bundle_incomplete** (critical) → needs: `author`, `first_party_data`, `named_examples`, `original_visuals`
  - Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-flag risk
- **E_no_first_party_data** (fail) → needs: `first_party_data`
  - no patch/before to rewrite

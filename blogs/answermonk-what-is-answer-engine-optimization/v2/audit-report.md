# v2 — Audit Report

**Score:** 33/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1729

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 46 |
| Quality | 60 |
| **Overall** | **33** |

## Findings at this version (22)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (11)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~13 FAQ pairs
- `S_tldr_missing` — No TL;DR block (expected <p data-tldr> or paragraph starting with 'TL;DR:')
- `S_missing_DefinedTerm_schema` — definitional posts should have DefinedTerm schema — not present
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_judge_human_voice_vs_committee` — Human voice vs committee 1/10 — Reads like a template produced by a marketing committee, with no individual voice anywhere.
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 1/10 — Every claim is hedged, generic, and risk-free.
- `H_judge_unexpected_phrasing` — Unexpected phrasing 1/10 — Entirely boilerplate phrasing; 'dominate product discovery,' 'informational landscape,' 'decision journeys.'
- `H_judge_specific_citations_(names,_prices,_dates` — Specific citations (names, prices, dates) 3/10 — Names a few LLMs and one schema type, but zero prices, dates, people, or concrete case dat…
- `H_judge_point_of_view_vs_neutral_survey` — Point of view vs neutral survey 2/10 — Balanced, encyclopedic framing throughout; takes no stance.
- `H_judge_quotability` — Quotability 1/10 — Nothing here is memorable or forwardable.
- `H_judge_intro_earns_attention` — Intro earns attention 2/10 — Opens with a dictionary definition; gives the reader no reason to keep going.

### 🟡 warn (9)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `S_h2_question_ratio_low` — 5/14 H2s are questions (36% — target ≥40%)
- `S_visible_last_updated_missing` — No visible 'Last updated' / 'Last reviewed' / 'Next review' stamp on page (schema dateModified alone isn't enough for users or AI)
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_em_dash_overuse` — 11 em-dashes (3.62 per 400 words; target <1)
- `H_tricolon_density` — 16 tricolons (6.58/500 words; target ≤2)
- `H_passive_overuse` — Passive-voice ratio 18% (target <15%)
- `Q_intro_hook` — intro_hook 5/10 — The opening sentence is a plain definition — accurate but inert. It carries zero tension, surprise, or narrative pull. A …
- `Q_specificity` — specificity 5/10 — Large sections of the body rely on abstract process language ('filter, condense, surface,' 'informational landscape,' 'a…

## What we did this round

Applied **13** · Skipped **3** · Drift **14** · Ambiguous **1** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `P_faq_count_mismatch` | attempt_rewrite | ✅ applied | FAQPage rebuilt from 7 visible FAQ(s) |
| `S_tldr_missing` | attempt_rewrite | ✅ applied | TL;DR inserted (438 chars) |
| `S_missing_DefinedTerm_schema` | insert_missing | ✅ applied | DefinedTerm 'answer engine optimization' appended |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_human_voice_vs_committee` | apply_patch | ⚠️ ambiguous | before string matches 2 locations — refusing to blind-replace |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ✅ applied | replaced single occurrence (111b → 133b) |
| `H_judge_unexpected_phrasing` | apply_patch | ✅ applied | replaced single occurrence (84b → 129b) |
| `H_judge_specific_citations_(names,_prices,_dates` | apply_patch | ✅ applied | replaced single occurrence (116b → 130b) |
| `H_judge_point_of_view_vs_neutral_survey` | apply_patch | ✅ applied | replaced single occurrence (118b → 128b) |
| `H_judge_quotability` | apply_patch | ✅ applied | replaced single occurrence (131b → 87b) |
| `H_judge_intro_earns_attention` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Answer engine … |
| `D_Person_missing_recommended` | insert_missing | ➖ skipped | no patch envelope |
| `S_h2_question_ratio_low` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `S_visible_last_updated_missing` | attempt_rewrite | ✅ applied | last-updated stamp inserted (2026-04-23) |
| `E_author_credentials_missing` | attempt_rewrite | 🔔 escalated | author.title and author.bio both absent in brief — caller must populate |
| `H_em_dash_overuse` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=em-dash-remova… |
| `H_em_dash_overuse` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=em-dash-remova… |
| `H_em_dash_overuse` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=em-dash-remova… |
| `H_em_dash_overuse` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=em-dash-remova… |
| `H_em_dash_overuse` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=em-dash-remova… |
| `H_tricolon_density` | attempt_rewrite | ✅ applied | rewrote 304b → 311b |
| `H_tricolon_density` | attempt_rewrite | ✅ applied | rewrote 304b → 308b |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_passive_overuse` | attempt_rewrite | ✅ applied | rewrote 358b → 353b |
| `H_passive_overuse` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_passive_overuse` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_passive_overuse` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_passive_overuse` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `Q_intro_hook` | apply_patch | ↩️ drift | before string not found in html (patch type=rewrite_intro, target=Answer engine… |
| `Q_specificity` | apply_patch | ✅ applied | replaced single occurrence (183b → 232b) |

## 🔔 Open items as of this version

- **E_author_sameas_missing** (critical) → needs: `author.linkedin_url`
  - Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- **E_human_signals_bundle_incomplete** (critical) → needs: `author`, `first_party_data`, `named_examples`, `original_visuals`
  - Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-flag risk
- **E_no_first_party_data** (fail) → needs: `first_party_data`
  - no patch/before to rewrite

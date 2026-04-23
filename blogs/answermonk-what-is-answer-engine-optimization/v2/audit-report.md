# v2 — Audit Report

**Score:** 36/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1648

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 46 |
| Quality | 70 |
| **Overall** | **36** |

## Findings at this version (22)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (11)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~14 FAQ pairs
- `S_tldr_missing` — No TL;DR block (expected <p data-tldr> or paragraph starting with 'TL;DR:')
- `S_missing_DefinedTerm_schema` — definitional posts should have DefinedTerm schema — not present
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_judge_specific_human_voice` — Specific human voice 1/10 — Reads as committee-written boilerplate with no individual voice or perspective.
- `H_judge_genuine_opinions` — Genuine opinions 1/10 — Every claim is safe, hedged, and uncontroversial—no stance taken.
- `H_judge_unexpected_phrasings` — Unexpected phrasings 1/10 — Pure boilerplate vocabulary: 'high-authority signals,' 'structured data,' 'leverage.'
- `H_judge_specific_citations` — Specific citations 3/10 — Vague placeholder citations like [geo-arxiv]; no real numbers, prices, or named studies in-line.
- `H_judge_point_of_view` — Point of view 2/10 — Surveys both sides flatly; never picks a side or makes a tradeoff explicit.
- `H_judge_quotable_sentence` — Quotable sentence 1/10 — Nothing here would survive being repeated aloud.
- `H_judge_intro_earns_attention` — Intro earns attention 2/10 — Opens with a dictionary definition; gives readers no reason to keep reading.

### 🟡 warn (9)
- `D_Organization_missing_recommended` — Organization missing recommended: logo, sameAs, contactPoint
- `D_WebPage_missing_recommended` — WebPage missing recommended: dateModified, isPartOf, primaryImageOfPage, inLanguage
- `S_visible_last_updated_missing` — No visible 'Last updated' / 'Last reviewed' / 'Next review' stamp on page (schema dateModified alone isn't enough for users or AI)
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_em_dash_overuse` — 8 em-dashes (2.71 per 400 words; target <1)
- `H_tricolon_density` — 10 tricolons (4.24/500 words; target ≤2)
- `H_passive_overuse` — Passive-voice ratio 17% (target <15%)
- `Q_intro_hook` — intro_hook 6/10 — The opening two sentences are a definition followed by a bland elaboration—functional but inert. There is no tension, sur…
- `Q_specificity` — specificity 6/10 — The body regularly drifts into process abstractions ('ongoing monitoring,' 'update data-driven content quarterly,' 'use …

## What we did this round

Applied **11** · Skipped **6** · Drift **0** · Ambiguous **3** · Escalated **2** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `P_faq_count_mismatch` | attempt_rewrite | ✅ applied | FAQPage rebuilt from 7 visible FAQ(s) |
| `S_tldr_missing` | attempt_rewrite | ✅ applied | TL;DR inserted (429 chars) |
| `S_missing_DefinedTerm_schema` | insert_missing | ✅ applied | DefinedTerm 'answer engine optimization' appended |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_specific_human_voice` | apply_patch | ✅ applied | replaced single occurrence (49b → 149b) |
| `H_judge_genuine_opinions` | apply_patch | ✅ applied | replaced single occurrence (109b → 136b) |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (136b → 134b) |
| `H_judge_specific_citations` | apply_patch | ✅ applied | replaced single occurrence (118b → 132b) |
| `H_judge_point_of_view` | apply_patch | ⚠️ ambiguous | before string matches 2 locations — refusing to blind-replace |
| `H_judge_quotable_sentence` | apply_patch | ✅ applied | replaced single occurrence (127b → 102b) |
| `H_judge_intro_earns_attention` | apply_patch | ⚠️ ambiguous | before string matches 2 locations — refusing to blind-replace |
| `D_Organization_missing_recommended` | insert_missing | ✅ applied | Organization enriched |
| `D_WebPage_missing_recommended` | insert_missing | ✅ applied | WebPage enriched |
| `S_visible_last_updated_missing` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `E_author_credentials_missing` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_em_dash_overuse` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_tricolon_density` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_passive_overuse` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `Q_intro_hook` | apply_patch | ⚠️ ambiguous | before string matches 2 locations — refusing to blind-replace |
| `Q_specificity` | apply_patch | ✅ applied | replaced single occurrence (87b → 198b) |

## 🔔 Open items as of this version

- **E_author_sameas_missing** (critical) → needs: `author.linkedin_url`
  - Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- **E_human_signals_bundle_incomplete** (critical) → needs: `author`, `first_party_data`, `named_examples`, `original_visuals`
  - Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-flag risk
- **E_no_first_party_data** (fail) → needs: `first_party_data`
  - no patch/before to rewrite

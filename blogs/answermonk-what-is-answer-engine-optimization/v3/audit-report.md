# v3 — Audit Report

**Score:** 46/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1786

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 7 |
| Humanization | 64 |
| Quality | 70 |
| **Overall** | **46** |

## Compared to previous version

7 fixed · 13 still present · 0 regressed

### ✅ Fixed
- `D_Organization_missing_recommended` (was warn)
- `D_WebPage_missing_recommended` (was warn)
- `S_tldr_missing` (was fail)
- `S_visible_last_updated_missing` (was warn)
- `S_missing_DefinedTerm_schema` (was fail)
- `H_judge_unexpected_phrasing` (was fail)
- `H_judge_specific_citations_(names/places/prices/` (was fail)

### ⚠️ Still present
- `P_faq_count_mismatch` (fail)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `E_no_first_party_data` (fail)
- `E_human_signals_bundle_incomplete` (critical)
- `H_em_dash_overuse` (warn)
- `H_tricolon_density` (warn)
- `H_judge_human_voice_vs_committee` (fail)
- `H_judge_genuine_opinions_vs_safe_claims` (warn)
- `H_judge_point_of_view_vs_both-sides_survey` (warn)
- `H_judge_quotability` (warn)
- `H_judge_intro_earns_attention` (fail)
- `Q_specificity` (warn)

## Findings at this version (15)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (4)
- `P_faq_count_mismatch` — FAQPage schema has 8 Questions but page shows ~15 FAQ pairs
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_judge_human_voice_vs_committee` — Human voice vs committee 3/10 — Reads like a content template with brief injected 'spicy' lines that feel bolted on.
- `H_judge_intro_earns_attention` — Intro earns attention 3/10 — Opens with a textbook definition repeated three times (TL;DR, quick answer, intro) before saying anything inte…

### 🟡 warn (9)
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_em_dash_overuse` — 17 em-dashes (4.71 per 400 words; target <1)
- `H_tricolon_density` — 20 tricolons (6.92/500 words; target ≤2)
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 5/10 — A few contrarian lines exist (schema overrated, E-E-A-T red herring) but most claims are safe and ge…
- `H_judge_unexpected_phrasings` — Unexpected phrasings 4/10 — One or two vivid lines ('lazy LLM will paste', 'feels safe plagiarizing') but drowned in boilerplate phrasing.
- `H_judge_point_of_view_vs_both-sides_survey` — Point of view vs both-sides survey 5/10 — Has glimmers of a POV but quickly retreats to balanced, hedged recommendations.
- `H_judge_quotability` — Quotability 4/10 — The 'lazy LLM paste' line is quotable; most others are forgettable definitional boilerplate.
- `Q_intro_hook` — intro_hook 6/10 — The post opens with a flat definition sentence that restates the title verbatim. There is no tension, surprising fact, or…
- `Q_specificity` — specificity 6/10 — The measurement section collapses into abstractions at key moments—'tools that aggregate,' 'refine content to strengthen…

## What we did this round

Applied **6** · Skipped **3** · Drift **0** · Ambiguous **3** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `P_faq_count_mismatch` | attempt_rewrite | ✅ applied | FAQPage rebuilt from 8 visible FAQ(s) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (125b → 115b) |
| `H_judge_intro_earns_attention` | apply_patch | ⚠️ ambiguous | before string matches 2 locations — refusing to blind-replace |
| `E_author_credentials_missing` | attempt_rewrite | 🔔 escalated | author.title and author.bio both absent in brief — caller must populate |
| `H_em_dash_overuse` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_tricolon_density` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ⚠️ ambiguous | before string matches 2 locations — refusing to blind-replace |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (108b → 120b) |
| `H_judge_point_of_view_vs_both-sides_survey` | apply_patch | ✅ applied | replaced single occurrence (122b → 130b) |
| `H_judge_quotability` | apply_patch | ✅ applied | replaced single occurrence (81b → 85b) |
| `Q_intro_hook` | apply_patch | ⚠️ ambiguous | before string matches 2 locations — refusing to blind-replace |
| `Q_specificity` | apply_patch | ✅ applied | replaced single occurrence (87b → 213b) |

## 🔔 Open items as of this version

- **E_author_sameas_missing** (critical) → needs: `author.linkedin_url`
  - Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- **E_human_signals_bundle_incomplete** (critical) → needs: `author`, `first_party_data`, `named_examples`, `original_visuals`
  - Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-flag risk
- **E_no_first_party_data** (fail) → needs: `first_party_data`
  - no patch/before to rewrite

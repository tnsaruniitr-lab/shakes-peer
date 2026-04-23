# v3 — Audit Report

**Score:** 44/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1695

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 73 |
| Quality | 60 |
| **Overall** | **44** |

## Compared to previous version

5 fixed · 12 still present · 0 regressed

### ✅ Fixed
- `S_tldr_missing` (was fail)
- `S_visible_last_updated_missing` (was warn)
- `H_judge_specific_citations_(names,_prices,_dates` (was warn)
- `H_judge_point_of_view_vs_both-sides_survey` (was fail)
- `H_judge_quotability` (was fail)

### ⚠️ Still present
- `D_Person_missing_recommended` (warn)
- `P_faq_count_mismatch` (fail)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `E_no_first_party_data` (fail)
- `E_human_signals_bundle_incomplete` (critical)
- `H_judge_specific_human_voice_vs_committee` (warn)
- `H_judge_genuine_opinions_vs_safe_claims` (warn)
- `H_judge_unexpected_phrasings` (warn)
- `H_judge_intro_earns_attention` (fail)
- `Q_intro_hook` (warn)
- `Q_specificity` (warn)

## Findings at this version (15)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (3)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~13 FAQ pairs
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_judge_intro_earns_attention` — Intro earns attention 3/10 — Opens with TL;DR boilerplate and a generic 'Dubai residents often...' line; the interesting hook sits buried m…

### 🟡 warn (10)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `D_entity_missing_id` — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_judge_specific_human_voice_vs_committee` — Specific human voice vs committee 4/10 — Mostly corporate editorial voice with occasional injected 'spicy' lines that feel pasted in.
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 5/10 — A few pointed opinions surface (lab numbers, annual physicals are theatre) but most claims are hedge…
- `H_judge_unexpected_phrasings` — Unexpected phrasings 6/10 — Some sharp lines ('the desert humbles every calendar', 'Ramadan eats your routine') but surrounded by generic f…
- `H_judge_point_of_view_vs_survey` — Point of view vs survey 5/10 — Takes a mild stance but mostly surveys recommendations neutrally.
- `H_judge_quotable_sentence` — Quotable sentence 6/10 — 'Annual physicals are theatre' and 'the desert humbles every calendar' are quotable; rest is forgettable.
- `Q_intro_hook` — intro_hook 4/10 — The opening sentence is a generic demographic statement with zero tension or specificity. It's functionally identical to …
- `Q_specificity` — specificity 6/10 — The post has pockets of good specificity (AED 1,200 panel cost, named nutrients, Ramadan timing) but several sections dr…

## What we did this round

Applied **6** · Skipped **4** · Drift **2** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_intro_earns_attention` | apply_patch | ✅ applied | replaced single occurrence (57b → 137b) |
| `H_judge_specific_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (87b → 101b) |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ✅ applied | replaced single occurrence (119b → 112b) |
| `H_judge_unexpected_phrasings` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=A Q1 health ch… |
| `H_judge_point_of_view_vs_survey` | apply_patch | ✅ applied | replaced single occurrence (216b → 119b) |
| `H_judge_quotable_sentence` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `Q_intro_hook` | apply_patch | ✅ applied | drift recovered via fuzzy whitespace match |
| `Q_specificity` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Reflecting on … |
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

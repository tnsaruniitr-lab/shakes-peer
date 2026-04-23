# v2 — Audit Report

**Score:** 41/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1643

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 62 |
| Quality | 63 |
| **Overall** | **41** |

## Findings at this version (17)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (9)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~13 FAQ pairs
- `S_tldr_missing` — No TL;DR block (expected <p data-tldr> or paragraph starting with 'TL;DR:')
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_judge_specific_human_voice_vs_committee` — Specific human voice vs committee 2/10 — Reads as corporate editorial content with no individual voice.
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 2/10 — Every claim is hedged, sourced, and risk-free.
- `H_judge_unexpected_phrasings` — Unexpected phrasings 3/10 — Phrases like 'low-pressure check-in' and 'calmly rather than reactively' are boilerplate.
- `H_judge_point_of_view_vs_both-sides_survey` — Point of view vs both-sides survey 3/10 — Surveys guidelines rather than taking a stance.
- `H_judge_quotability` — Quotability 2/10 — Nothing memorable enough to repeat.
- `H_judge_intro_earns_attention` — Intro earns attention 3/10 — Opens with a generic observation and SEO-style framing.

### 🟡 warn (6)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `S_visible_last_updated_missing` — No visible 'Last updated' / 'Last reviewed' / 'Next review' stamp on page (schema dateModified alone isn't enough for users or AI)
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_judge_specific_citations_(names,_prices,_dates` — Specific citations (names, prices, dates) 6/10 — Mentions AED 1,200, 19 March 2026, DHA, MOHAP, but no specific clinics, study authors, or …
- `Q_intro_hook` — intro_hook 5/10 — The opening sentence is a generic observation that could apply to any city and any year. It commits the classic throat-cl…
- `Q_specificity` — specificity 6/10 — Throughout the post, lifestyle references stay vague ('family routines,' 'work stress,' 'local conditions') when the Dub…

## What we did this round

Applied **10** · Skipped **3** · Drift **1** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_specific_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (106b → 122b) |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=A Q1 health ch… |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (200b → 112b) |
| `H_judge_point_of_view_vs_both-sides_survey` | apply_patch | ✅ applied | replaced single occurrence (122b → 112b) |
| `H_judge_quotability` | apply_patch | ✅ applied | replaced single occurrence (72b → 121b) |
| `H_judge_intro_earns_attention` | apply_patch | ✅ applied | replaced single occurrence (97b → 145b) |
| `H_judge_specific_citations_(names,_prices,_dates` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `Q_intro_hook` | apply_patch | ✅ applied | drift recovered via fuzzy whitespace match |
| `Q_specificity` | apply_patch | ✅ applied | replaced single occurrence (167b → 216b) |
| `P_faq_count_mismatch` | attempt_rewrite | ✅ applied | FAQPage rebuilt from 7 visible FAQ(s) |
| `S_tldr_missing` | attempt_rewrite | ✅ applied | TL;DR inserted (313 chars) |
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

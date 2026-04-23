# v4 — Audit Report

**Score:** 47/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1739

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 73 |
| Quality | 70 |
| **Overall** | **47** |

## Compared to previous version

2 fixed · 12 still present · 0 regressed

### ✅ Fixed
- `H_judge_point_of_view_vs_survey` (was warn)
- `H_judge_quotable_sentence` (was warn)

### ⚠️ Still present
- `D_Person_missing_recommended` (warn)
- `D_entity_missing_id` (warn)
- `P_faq_count_mismatch` (fail)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `E_no_first_party_data` (fail)
- `E_human_signals_bundle_incomplete` (critical)
- `H_low_burstiness` (warn)
- `H_judge_specific_human_voice_vs_committee` (warn)
- `H_judge_genuine_opinions_vs_safe_claims` (warn)
- `H_judge_unexpected_phrasings` (warn)
- `H_judge_intro_earns_attention` (warn)

## Findings at this version (15)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (2)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~14 FAQ pairs
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation

### 🟡 warn (11)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `D_entity_missing_id` — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_em_dash_overuse` — 7 em-dashes (1.52 per 400 words; target <1)
- `H_low_burstiness` — Sentence-length burstiness 0.53 (target ≥0.55) — rhythm too uniform
- `H_judge_specific_human_voice_vs_committee` — Specific human voice vs committee 5/10 — Mostly corporate blog voice with occasional injected opinions that feel bolted on rather than orga…
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 6/10 — Has some spicy opinions ('mostly theatre', 'Skip the vision boards') but buried in safe wellness-blo…
- `H_judge_unexpected_phrasings` — Unexpected phrasings 6/10 — Good moments ('shelf life of 78 days', '45°C August') mixed with generic wellness phrasing.
- `H_judge_quotable_sentences` — Quotable sentences 6/10 — A few quotable lines exist but drown in boilerplate.
- `H_judge_intro_earns_attention` — Intro earns attention 4/10 — Opens with TL;DR boilerplate and a vague cliché; the 78-days line buried later should lead.
- `Q_specificity` — specificity 6/10 — Several passages dissolve into abstraction: 'current mood, motivation, and environment' are placeholders, not facts. The…

## What we did this round

Applied **7** · Skipped **4** · Drift **4** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_em_dash_overuse` | apply_patch | ✅ applied | replaced single occurrence (663b → 662b) |
| `H_em_dash_overuse` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=em-dash-remova… |
| `H_em_dash_overuse` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=em-dash-remova… |
| `H_em_dash_overuse` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=em-dash-remova… |
| `H_low_burstiness` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_specific_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (84b → 124b) |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ✅ applied | replaced single occurrence (145b → 115b) |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (180b → 109b) |
| `H_judge_quotable_sentences` | apply_patch | ✅ applied | replaced single occurrence (114b → 133b) |
| `H_judge_intro_earns_attention` | apply_patch | ✅ applied | replaced single occurrence (111b → 146b) |
| `Q_specificity` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Quarterly self… |
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

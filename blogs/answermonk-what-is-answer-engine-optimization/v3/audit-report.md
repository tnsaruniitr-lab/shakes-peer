# v3 — Audit Report

**Score:** 41/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1684

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 64 |
| Quality | 60 |
| **Overall** | **41** |

## Compared to previous version

8 fixed · 14 still present · 0 regressed

### ✅ Fixed
- `S_tldr_missing` (was fail)
- `S_visible_last_updated_missing` (was warn)
- `S_missing_DefinedTerm_schema` (was fail)
- `H_judge_human_voice_vs_committee` (was fail)
- `H_judge_unexpected_phrasing` (was fail)
- `H_judge_specific_citations_(names,_prices,_dates` (was fail)
- `H_judge_point_of_view_vs_neutral_survey` (was fail)
- `H_judge_quotability` (was fail)

### ⚠️ Still present
- `D_Person_missing_recommended` (warn)
- `P_faq_count_mismatch` (fail)
- `S_h2_question_ratio_low` (warn)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `E_no_first_party_data` (fail)
- `E_human_signals_bundle_incomplete` (critical)
- `H_em_dash_overuse` (warn)
- `H_tricolon_density` (warn)
- `H_passive_overuse` (warn)
- `H_judge_genuine_opinions_vs_safe_claims` (warn)
- `H_judge_intro_earns_attention` (fail)
- `Q_intro_hook` (warn)
- `Q_specificity` (warn)

## Findings at this version (20)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (3)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~13 FAQ pairs
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_judge_intro_earns_attention` — Intro earns attention 3/10 — Opens with duplicated nav/title clutter and a generic TL;DR. Nothing hooks the reader in the first two sentenc…

### 🟡 warn (15)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `D_entity_missing_id` — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `S_tldr_word_count` — TL;DR is 63 words (target 40–58)
- `S_h2_question_ratio_low` — 5/14 H2s are questions (36% — target ≥40%)
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_em_dash_overuse` — 15 em-dashes (4.57 per 400 words; target <1)
- `H_tricolon_density` — 16 tricolons (6.09/500 words; target ≤2)
- `H_passive_overuse` — Passive-voice ratio 18% (target <15%)
- `H_judge_specific_human_voice_vs_committee` — Specific human voice vs committee 4/10 — Mostly boilerplate marketing-speak with a few injected 'spicy' lines that feel bolted on rather th…
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 5/10 — A couple of opinionated jabs exist, but most claims hedge into generic best-practice territory.
- `H_judge_unexpected_phrasings` — Unexpected phrasings 5/10 — The gym-class simile and 'quotable = citable' line are fresh, but they're drowned in predictable phrasing.
- `H_judge_point_of_view_vs_both-sides_survey` — Point of view vs both-sides survey 5/10 — Occasional POV flashes ('SEO is dying slower than Twitter pundits claim') but mostly balanced sur…
- `H_judge_quotable_to_a_friend` — Quotable to a friend 5/10 — The gym-class line and 'quotable isn't citable' are genuinely share-worthy; rest is forgettable.
- `Q_intro_hook` — intro_hook 5/10 — The first two body sentences are pure definition-throat-clearing. The most arresting fact in the entire post—the 34% vs 4…
- `Q_specificity` — specificity 6/10 — Several bullet-point summary lines ('It influences brand perception in generative search,' 'Emphasize freshness and auth…

## What we did this round

Applied **8** · Skipped **6** · Drift **16** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `P_faq_count_mismatch` | attempt_rewrite | ✅ applied | FAQPage rebuilt from 7 visible FAQ(s) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_intro_earns_attention` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Blog AEO Funda… |
| `D_Person_missing_recommended` | insert_missing | ➖ skipped | no patch envelope |
| `D_entity_missing_id` | insert_missing | ➖ skipped | no patch envelope |
| `S_tldr_word_count` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `S_h2_question_ratio_low` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `E_author_credentials_missing` | attempt_rewrite | 🔔 escalated | author.title and author.bio both absent in brief — caller must populate |
| `H_em_dash_overuse` | apply_patch | ✅ applied | replaced single occurrence (379b → 381b) |
| `H_em_dash_overuse` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=em-dash-remova… |
| `H_em_dash_overuse` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=em-dash-remova… |
| `H_em_dash_overuse` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=em-dash-remova… |
| `H_em_dash_overuse` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=em-dash-remova… |
| `H_em_dash_overuse` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=em-dash-remova… |
| `H_tricolon_density` | attempt_rewrite | ✅ applied | rewrote 301b → 316b |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_passive_overuse` | attempt_rewrite | ✅ applied | rewrote 282b → 280b |
| `H_passive_overuse` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_passive_overuse` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_passive_overuse` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_passive_overuse` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_judge_specific_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (103b → 95b) |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ✅ applied | replaced single occurrence (97b → 122b) |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (53b → 84b) |
| `H_judge_point_of_view_vs_both-sides_survey` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=SEO optimizes … |
| `H_judge_quotable_to_a_friend` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `Q_intro_hook` | apply_patch | ↩️ drift | before string not found in html (patch type=rewrite_intro, target=Answer engine… |
| `Q_specificity` | apply_patch | ✅ applied | replaced single occurrence (52b → 212b) |

## 🔔 Open items as of this version

- **E_author_sameas_missing** (critical) → needs: `author.linkedin_url`
  - Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- **E_human_signals_bundle_incomplete** (critical) → needs: `author`, `first_party_data`, `named_examples`, `original_visuals`
  - Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-flag risk
- **E_no_first_party_data** (fail) → needs: `first_party_data`
  - no patch/before to rewrite

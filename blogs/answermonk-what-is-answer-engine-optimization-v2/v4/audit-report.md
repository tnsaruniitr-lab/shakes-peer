# v4 — Audit Report

**Score:** 40/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1533

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 59 |
| Quality | 67 |
| **Overall** | **40** |

## Compared to previous version

4 fixed · 14 still present · 0 regressed

### ✅ Fixed
- `H_judge_genuine_opinions_vs_safe_claims` (was warn)
- `H_judge_point_of_view_vs_both-sides_survey` (was warn)
- `H_judge_quotable_to_a_friend` (was warn)
- `H_judge_intro_earns_attention_in_2_sentences` (was fail)

### ⚠️ Still present
- `D_Person_missing_recommended` (warn)
- `D_entity_missing_id` (warn)
- `P_faq_count_mismatch` (fail)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `E_no_first_party_data` (fail)
- `E_human_signals_bundle_incomplete` (critical)
- `H_em_dash_overuse` (warn)
- `H_tricolon_density` (warn)
- `H_banned_vocabulary` (fail)
- `H_passive_overuse` (warn)
- `H_judge_human_voice_vs_committee` (warn)
- `H_judge_unexpected_phrasings` (warn)
- `Q_intro_hook` (warn)

## Findings at this version (19)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (4)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~14 FAQ pairs
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_banned_vocabulary` — AI-signature vocabulary present: robust(1)
- `H_judge_intro_earns_attention` — Intro earns attention 3/10 — Opens with a generic definition and an 'in this article' meta-paragraph; nothing hooks the reader.

### 🟡 warn (13)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `D_entity_missing_id` — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_em_dash_overuse` — 7 em-dashes (2.31 per 400 words; target <1)
- `H_tricolon_density` — 9 tricolons (3.71/500 words; target ≤2)
- `H_passive_overuse` — Passive-voice ratio 21% (target <15%)
- `H_judge_human_voice_vs_committee` — Human voice vs committee 4/10 — Mostly committee-speak with scattered flashes of voice ('writing sentences an LLM can lift without embarras…
- `H_judge_genuine_opinions` — Genuine opinions 6/10 — Some real takes appear ('E-E-A-T is mostly theater', 'Most AEO advice is garbage') but they're buried among safe ge…
- `H_judge_unexpected_phrasings` — Unexpected phrasings 5/10 — A few vivid lines ('quotable source, period') are surrounded by predictable SEO-blog phrasing.
- `H_judge_point_of_view` — Point of view 6/10 — POV exists but gets diluted by neutral bullet-list explainer sections.
- `H_judge_quotability` — Quotability 6/10 — 'AEO is the art of writing sentences an LLM can lift without embarrassment' is genuinely quotable; most other lines aren…
- `Q_intro_hook` — intro_hook 6/10 — The post opens with a competent TL;DR but then immediately restates the definition verbatim in the first body sentence. T…
- `Q_specificity` — specificity 6/10 — The Princeton/GEO statistic (30-40% citation boost, 25% from statistics) is the only truly anchored data point in the pi…

## What we did this round

Applied **8** · Skipped **6** · Drift **14** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_banned_vocabulary` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_intro_earns_attention` | apply_patch | ✅ applied | replaced single occurrence (181b → 130b) |
| `H_em_dash_overuse` | apply_patch | ✅ applied | replaced single occurrence (474b → 475b) |
| `H_em_dash_overuse` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=em-dash-remova… |
| `H_em_dash_overuse` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=em-dash-remova… |
| `H_em_dash_overuse` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=em-dash-remova… |
| `H_em_dash_overuse` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=em-dash-remova… |
| `H_tricolon_density` | attempt_rewrite | ✅ applied | rewrote 381b → 386b |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_passive_overuse` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_passive_overuse` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_passive_overuse` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_passive_overuse` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_passive_overuse` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_judge_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (176b → 170b) |
| `H_judge_genuine_opinions` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (64b → 93b) |
| `H_judge_point_of_view` | apply_patch | ✅ applied | replaced single occurrence (70b → 106b) |
| `H_judge_quotability` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `Q_intro_hook` | apply_patch | ✅ applied | drift recovered via fuzzy whitespace match |
| `Q_specificity` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=AEO requires d… |
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

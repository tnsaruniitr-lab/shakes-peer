# v4 — Audit Report

**Score:** 48/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1760

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 75 |
| Quality | 70 |
| **Overall** | **48** |

## Compared to previous version

4 fixed · 11 still present · 0 regressed

### ✅ Fixed
- `H_judge_specific_human_voice_vs_committee` (was fail)
- `H_judge_point_of_view_vs_survey` (was warn)
- `H_judge_quotability` (was warn)
- `Q_specificity` (was warn)

### ⚠️ Still present
- `D_Person_missing_recommended` (warn)
- `D_entity_missing_id` (warn)
- `P_faq_count_mismatch` (fail)
- `S_tldr_word_count` (warn)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `E_no_first_party_data` (fail)
- `E_human_signals_bundle_incomplete` (critical)
- `H_judge_genuine_opinions_vs_safe_claims` (warn)
- `H_judge_unexpected_phrasings` (warn)
- `H_judge_intro_earns_attention` (fail)

## Findings at this version (15)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (3)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~13 FAQ pairs
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_judge_intro_earns_attention` — Intro earns attention 3/10 — Opens with a TL;DR, meta-summary, and SEO boilerplate before anything interesting happens.

### 🟡 warn (10)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `D_entity_missing_id` — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `S_tldr_word_count` — TL;DR is 61 words (target 40–58)
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_judge_human_voice_vs_committee` — Human voice vs committee 4/10 — Most of the post reads like committee-written marketing copy, though a few sharp lines break through.
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 6/10 — Has some opinionated zingers but surrounded by hedged, safe institutional claims.
- `H_judge_unexpected_phrasings` — Unexpected phrasings 6/10 — Lines like 'annual screenings are mostly theatre' and 'swap tactics, not self-worth' are vivid, but padded by b…
- `H_judge_point_of_view` — Point of view 6/10 — Has a clear thesis (quarterly > annual) but drifts into neutral explainer mode in the middle sections.
- `H_judge_quotable_to_a_friend` — Quotable to a friend 6/10 — A few genuinely quotable lines ('Miss a target? Treat it like a failed A/B test, not a character flaw') but the…
- `Q_intro_hook` — intro_hook 6/10 — The opening body sentence is factual but flat — it states the obvious without tension or surprise. The TL;DR and section …

## What we did this round

Applied **6** · Skipped **5** · Drift **1** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_intro_earns_attention` | apply_patch | ✅ applied | replaced single occurrence (193b → 180b) |
| `S_tldr_word_count` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (200b → 114b) |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ✅ applied | replaced single occurrence (98b → 80b) |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (181b → 82b) |
| `H_judge_point_of_view` | apply_patch | ✅ applied | replaced single occurrence (189b → 109b) |
| `H_judge_quotable_to_a_friend` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `Q_intro_hook` | apply_patch | ↩️ drift | before string not found in html (patch type=rewrite_intro, target=On 19 March 2… |
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

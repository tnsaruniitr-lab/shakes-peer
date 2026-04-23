# v4 — Audit Report

**Score:** 51/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1829

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 82 |
| Quality | 73 |
| **Overall** | **51** |

## Compared to previous version

2 fixed · 12 still present · 0 regressed

### ✅ Fixed
- `H_judge_genuine_opinions_vs_safe_claims` (was warn)
- `H_judge_quotable_sentence` (was warn)

### ⚠️ Still present
- `D_Person_missing_recommended` (warn)
- `D_entity_missing_id` (warn)
- `P_faq_count_mismatch` (fail)
- `S_toc_missing` (warn)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `E_no_first_party_data` (fail)
- `E_human_signals_bundle_incomplete` (critical)
- `H_judge_specific_human_voice_vs_committee` (warn)
- `H_judge_unexpected_phrasings` (warn)
- `H_judge_intro_earns_attention` (warn)
- `Q_specificity` (warn)

## Findings at this version (13)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (2)
- `P_faq_count_mismatch` — FAQPage schema has 10 Questions but page shows ~22 FAQ pairs
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation

### 🟡 warn (9)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `D_entity_missing_id` — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `S_toc_missing` — Post is 2219 words (pillar) — include a <nav aria-label="Table of contents"> for LLM outline extraction
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_judge_specific_human_voice_vs_committee` — Specific human voice vs committee 6/10 — Some punchy lines ('someone will still be sulting about it'), but overall reads like a branded con…
- `H_judge_unexpected_phrasings` — Unexpected phrasings 6/10 — Has some fresh phrasing ('hangover half of the group', 'sand-to-terminal move'), but leans on tropes like 'worl…
- `H_judge_quotable_sentences` — Quotable sentences 6/10 — A couple of lines are quotable ('WhatsApp is for ranting'), but most sentences are utilitarian.
- `H_judge_intro_earns_attention` — Intro earns attention 5/10 — Generic hook followed by a meta-description of the article; doesn't create specificity or stakes fast.
- `Q_specificity` — specificity 6/10 — The '500 friend groups' statistic is unverifiable and vague—500 out of what universe? It reads as a made-up authority si…

## What we did this round

Applied **5** · Skipped **4** · Drift **1** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `S_toc_missing` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_specific_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (54b → 113b) |
| `H_judge_unexpected_phrasings` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=If you're in t… |
| `H_judge_quotable_sentences` | apply_patch | ✅ applied | replaced single occurrence (82b → 137b) |
| `H_judge_intro_earns_attention` | apply_patch | ✅ applied | drift recovered via fuzzy whitespace match |
| `Q_specificity` | apply_patch | ✅ applied | replaced single occurrence (125b → 197b) |
| `P_faq_count_mismatch` | attempt_rewrite | ✅ applied | FAQPage rebuilt from 10 visible FAQ(s) |
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

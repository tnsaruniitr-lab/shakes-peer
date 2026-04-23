# v2 — Audit Report

**Score:** 42/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1715

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 60 |
| Quality | 73 |
| **Overall** | **42** |

## Findings at this version (16)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (9)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~13 FAQ pairs
- `S_tldr_missing` — No TL;DR block (expected <p data-tldr> or paragraph starting with 'TL;DR:')
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_judge_specific_human_voice_vs_committee` — Specific human voice vs committee 2/10 — Reads entirely as corporate editorial output with no individual voice.
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 2/10 — Every claim is hedged, generic, and risk-free.
- `H_judge_unexpected_phrasing` — Unexpected phrasing 2/10 — Relies on tired wellness clichés like 'progress not perfection' and 'close the loop'.
- `H_judge_point_of_view` — Point of view 3/10 — Surveys guidelines evenly without taking a stance on what actually matters.
- `H_judge_quotable_sentence` — Quotable sentence 2/10 — Nothing memorable; language is bureaucratic and brand-laden.
- `H_judge_intro_earns_attention` — Intro earns attention 3/10 — Opens with a generic framework promise rather than a hook.

### 🟡 warn (5)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `S_visible_last_updated_missing` — No visible 'Last updated' / 'Last reviewed' / 'Next review' stamp on page (schema dateModified alone isn't enough for users or AI)
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_judge_specific_citations` — Specific citations 5/10 — Mentions DHA, MOHAP, BMJ, Lancet and one price, but citations are unlinked placeholders and details are thin.
- `Q_specificity` — specificity 6/10 — Sporadic specificity exists (AED 1,200 screening cost, taraweeh mention, late-March heat timing) but the nutrition and m…

## What we did this round

Applied **10** · Skipped **2** · Drift **1** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_specific_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (100b → 98b) |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ✅ applied | replaced single occurrence (200b → 130b) |
| `H_judge_unexpected_phrasing` | apply_patch | ✅ applied | replaced single occurrence (56b → 69b) |
| `H_judge_point_of_view` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=A pragmatic Q1… |
| `H_judge_quotable_sentence` | apply_patch | ✅ applied | replaced single occurrence (141b → 29b) |
| `H_judge_intro_earns_attention` | apply_patch | ✅ applied | replaced single occurrence (193b → 169b) |
| `H_judge_specific_citations` | apply_patch | ✅ applied | replaced single occurrence (101b → 104b) |
| `Q_specificity` | apply_patch | ✅ applied | replaced single occurrence (99b → 210b) |
| `P_faq_count_mismatch` | attempt_rewrite | ✅ applied | FAQPage rebuilt from 7 visible FAQ(s) |
| `S_tldr_missing` | attempt_rewrite | ✅ applied | TL;DR inserted (421 chars) |
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

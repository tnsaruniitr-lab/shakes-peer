# v2 — Audit Report

**Score:** 41/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1832

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 59 |
| Quality | 70 |
| **Overall** | **41** |

## Findings at this version (17)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (9)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~14 FAQ pairs
- `S_tldr_missing` — No TL;DR block (expected <p data-tldr> or paragraph starting with 'TL;DR:')
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_judge_human_voice_vs_committee` — Human voice vs committee 2/10 — Reads as brand editorial copy with no individual voice; hedged, plural, and formulaic throughout.
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 3/10 — Nearly every claim is a safe, guideline-aligned platitude with no stance that could be disagreed wit…
- `H_judge_unexpected_phrasings` — Unexpected phrasings 3/10 — Phrases like 'course-correcting early', 'progress, not perfection', and 'all-or-nothing cycles' are wellness-bl…
- `H_judge_point_of_view` — Point of view 3/10 — The piece surveys guidelines rather than taking a position; it never says anyone is wrong about anything.
- `H_judge_quotable_sentence` — Quotable sentence 2/10 — No sentence is sharp, funny, or surprising enough to repeat.
- `H_judge_intro_earns_attention` — Intro earns attention 3/10 — Opens with a generic abstraction and a keyword-stuffed second sentence rather than a hook.

### 🟡 warn (6)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `S_visible_last_updated_missing` — No visible 'Last updated' / 'Last reviewed' / 'Next review' stamp on page (schema dateModified alone isn't enough for users or AI)
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_low_burstiness` — Sentence-length burstiness 0.52 (target ≥0.55) — rhythm too uniform
- `H_judge_specific_citations` — Specific citations 6/10 — Has some specifics (Ramadan date, AED 1,200, age 40) but references are vague ('BMJ', 'The Lancet') without title…
- `Q_specificity` — specificity 6/10 — Several passages float in abstraction and motivational language without anchoring claims in numbers, named sources, or c…

## What we did this round

Applied **9** · Skipped **3** · Drift **2** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (125b → 119b) |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ✅ applied | replaced single occurrence (70b → 145b) |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (91b → 114b) |
| `H_judge_point_of_view` | apply_patch | ✅ applied | replaced single occurrence (72b → 154b) |
| `H_judge_quotable_sentence` | apply_patch | ✅ applied | replaced single occurrence (100b → 126b) |
| `H_judge_intro_earns_attention` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Dubai's Q1 can… |
| `H_low_burstiness` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_specific_citations` | apply_patch | ✅ applied | replaced single occurrence (147b → 151b) |
| `Q_specificity` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Quarterly revi… |
| `P_faq_count_mismatch` | attempt_rewrite | ✅ applied | FAQPage rebuilt from 7 visible FAQ(s) |
| `S_tldr_missing` | attempt_rewrite | ✅ applied | TL;DR inserted (367 chars) |
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

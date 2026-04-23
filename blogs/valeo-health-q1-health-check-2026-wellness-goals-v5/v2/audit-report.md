# v2 — Audit Report

**Score:** 42/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1931

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 62 |
| Quality | 70 |
| **Overall** | **42** |

## Findings at this version (17)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (8)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~14 FAQ pairs
- `S_tldr_missing` — No TL;DR block (expected <p data-tldr> or paragraph starting with 'TL;DR:')
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_judge_specific_human_voice_vs_committee` — Specific human voice vs committee 2/10 — Reads as corporate editorial with no individual voice; hedged, brand-safe phrasing throughout.
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 3/10 — Claims are all evidence-hedged; no opinions that could offend or be wrong.
- `H_judge_unexpected_phrasings` — Unexpected phrasings 2/10 — Phrases like 'evidence-backed,' 'unique lifestyle,' 'compassionately,' 'pragmatic lever' are pure AI boilerplat…
- `H_judge_quotable_sentence` — Quotable sentence 2/10 — Nothing memorable; everything is reportage-flat.
- `H_judge_intro_earns_attention` — Intro earns attention 3/10 — Opens with keyword-stuffed thesis statement; no hook, image, or stake.

### 🟡 warn (7)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `M_description_length` — Meta description length 107 (target 110–170)
- `S_visible_last_updated_missing` — No visible 'Last updated' / 'Last reviewed' / 'Next review' stamp on page (schema dateModified alone isn't enough for users or AI)
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_judge_specific_citations` — Specific citations 6/10 — Has numbers, AED prices, DHA rules—but references are vague bracket tags with no authors, dates, or URLs; stats f…
- `H_judge_point_of_view_vs_balanced_survey` — Point of view vs balanced survey 4/10 — Mostly neutral institutional summary; rare mild stances are immediately softened.
- `Q_intro_hook` — intro_hook 6/10 — The actual opening two sentences are the Quick Answer box and a stat sentence, not a narrative hook. The stat is promisin…

## What we did this round

Applied **10** · Skipped **3** · Drift **1** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_specific_human_voice_vs_committee` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=By Valeo Healt… |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ✅ applied | replaced single occurrence (98b → 144b) |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (161b → 200b) |
| `H_judge_quotable_sentence` | apply_patch | ✅ applied | replaced single occurrence (63b → 58b) |
| `H_judge_intro_earns_attention` | apply_patch | ✅ applied | drift recovered via fuzzy whitespace match |
| `M_description_length` | edit_schema | ➖ skipped | no patch envelope |
| `H_judge_specific_citations` | apply_patch | ✅ applied | replaced single occurrence (202b → 130b) |
| `H_judge_point_of_view_vs_balanced_survey` | apply_patch | ✅ applied | replaced single occurrence (154b → 134b) |
| `Q_intro_hook` | apply_patch | ✅ applied | replaced single occurrence (167b → 234b) |
| `P_faq_count_mismatch` | attempt_rewrite | ✅ applied | FAQPage rebuilt from 7 visible FAQ(s) |
| `S_tldr_missing` | attempt_rewrite | ✅ applied | TL;DR inserted (399 chars) |
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

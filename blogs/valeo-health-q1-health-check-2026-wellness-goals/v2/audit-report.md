# v2 — Audit Report

**Score:** 35/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1623

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 51 |
| Quality | 57 |
| **Overall** | **35** |

## Findings at this version (18)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (10)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~13 FAQ pairs
- `S_tldr_missing` — No TL;DR block (expected <p data-tldr> or paragraph starting with 'TL;DR:')
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_banned_vocabulary` — AI-signature vocabulary present: cornerstone(1), foster(1)
- `H_judge_specific_human_voice_vs_committee` — Specific human voice vs committee 2/10 — Reads as a corporate editorial board with no individual perspective or voice.
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 1/10 — Every claim is hedged, generic, and uncontroversial; no stance taken.
- `H_judge_unexpected_phrasings` — Unexpected phrasings 2/10 — Language is boilerplate wellness-speak: 'small detours', 'big setbacks', 'build a habit'.
- `H_judge_point_of_view_vs_neutral_survey` — Point of view vs neutral survey 3/10 — Presents consensus guidance without taking a clear position on what actually works.
- `H_judge_quotable_sentence` — Quotable sentence 1/10 — Nothing memorable or shareable; all sentences are interchangeable wellness filler.
- `H_judge_intro_earns_attention` — Intro earns attention 2/10 — Opens with SEO meta-description and repeats the title; no hook or tension.

### 🟡 warn (6)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `S_visible_last_updated_missing` — No visible 'Last updated' / 'Last reviewed' / 'Next review' stamp on page (schema dateModified alone isn't enough for users or AI)
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_judge_specific_citations_(names,_places,_price` — Specific citations (names, places, prices, dates) 5/10 — Mentions DHA, MOHAP, Ramadan, 1.5-2L water, but no prices, clinic names, specific …
- `Q_intro_hook` — intro_hook 4/10 — The opening sentence is pure throat-clearing: it restates the title verbatim and adds no tension, surprise, or specificit…
- `Q_specificity` — specificity 5/10 — The post frequently uses abstractions ('holistic well-being,' 'sustainable behaviour change,' 'lasting health benefits,'…

## What we did this round

Applied **10** · Skipped **3** · Drift **2** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_banned_vocabulary` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_specific_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (51b → 102b) |
| `H_judge_genuine_opinions_vs_safe_claims` | apply_patch | ✅ applied | replaced single occurrence (63b → 115b) |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (200b → 110b) |
| `H_judge_point_of_view_vs_neutral_survey` | apply_patch | ✅ applied | replaced single occurrence (120b → 154b) |
| `H_judge_quotable_sentence` | apply_patch | ✅ applied | replaced single occurrence (81b → 99b) |
| `H_judge_intro_earns_attention` | apply_patch | ✅ applied | replaced single occurrence (122b → 151b) |
| `H_judge_specific_citations_(names,_places,_price` | apply_patch | ✅ applied | replaced single occurrence (192b → 121b) |
| `Q_intro_hook` | apply_patch | ↩️ drift | before string not found in html (patch type=rewrite_intro, target=Review your 2… |
| `Q_specificity` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Pragmatic self… |
| `P_faq_count_mismatch` | attempt_rewrite | ✅ applied | FAQPage rebuilt from 7 visible FAQ(s) |
| `S_tldr_missing` | attempt_rewrite | ✅ applied | TL;DR inserted (384 chars) |
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

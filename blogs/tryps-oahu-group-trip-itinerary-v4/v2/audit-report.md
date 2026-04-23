# v2 — Audit Report

**Score:** 50/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1750

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 76 |
| Quality | 77 |
| **Overall** | **50** |

## Findings at this version (15)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (3)
- `P_faq_count_mismatch` — FAQPage schema has 10 Questions but page shows ~22 FAQ pairs
- `S_tldr_missing` — No TL;DR block (expected <p data-tldr> or paragraph starting with 'TL;DR:')
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation

### 🟡 warn (10)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `S_visible_last_updated_missing` — No visible 'Last updated' / 'Last reviewed' / 'Next review' stamp on page (schema dateModified alone isn't enough for users or AI)
- `S_toc_missing` — Post is 2219 words (pillar) — include a <nav aria-label="Table of contents"> for LLM outline extraction
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_judge_specific_human_voice_vs_committee` — Specific human voice vs committee 4/10 — Reads like an SEO template with tidy tricolons and 'Quick answer' blocks rather than one person ta…
- `H_judge_genuine_opinions_vs_safe_claims` — Genuine opinions vs safe claims 6/10 — Has some real takes (Duke's is touristy and fine, WhatsApp is for ranting), enough to clear the bar.
- `H_judge_unexpected_phrasings` — Unexpected phrasings 5/10 — Leans on predictable phrases like 'non-negotiable,' 'crowd-pleaser,' 'worth the alarm.'
- `H_judge_quotable_sentences` — Quotable sentences 4/10 — A few near-quotables, but most lines are functional itinerary prose rather than memorable.
- `H_judge_intro_earns_attention` — Intro earns attention 5/10 — Opens with a generic hook plus an SEO 'Quick answer' block before the reader has a reason to care.
- `Q_specificity` — specificity 6/10 — Day 5's lunch block is the one clear lapse into vague geography ('near Kailua Beach') after the post otherwise names spe…

## What we did this round

Applied **8** · Skipped **4** · Drift **0** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `S_toc_missing` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_specific_human_voice_vs_committee` | apply_patch | ✅ applied | replaced single occurrence (189b → 131b) |
| `H_judge_genuine_opinions_vs_safe_claims` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (30b → 95b) |
| `H_judge_quotable_sentences` | apply_patch | ✅ applied | replaced single occurrence (64b → 99b) |
| `H_judge_intro_earns_attention` | apply_patch | ✅ applied | replaced single occurrence (94b → 159b) |
| `Q_specificity` | apply_patch | ✅ applied | replaced single occurrence (98b → 230b) |
| `P_faq_count_mismatch` | attempt_rewrite | ✅ applied | FAQPage rebuilt from 10 visible FAQ(s) |
| `S_tldr_missing` | attempt_rewrite | ✅ applied | TL;DR inserted (358 chars) |
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

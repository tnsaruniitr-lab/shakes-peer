# v3 — Audit Report

**Score:** 39/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1648

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 59 |
| Quality | 63 |
| **Overall** | **39** |

## Compared to previous version

3 fixed · 19 still present · 0 regressed

### ✅ Fixed
- `S_missing_DefinedTerm_schema` (was fail)
- `H_judge_specific_human_voice` (was fail)
- `H_judge_specific_citations` (was fail)

### ⚠️ Still present
- `D_Organization_missing_recommended` (warn)
- `D_WebPage_missing_recommended` (warn)
- `P_faq_count_mismatch` (fail)
- `S_tldr_missing` (fail)
- `S_visible_last_updated_missing` (warn)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `E_no_first_party_data` (fail)
- `E_human_signals_bundle_incomplete` (critical)
- `H_em_dash_overuse` (warn)
- `H_tricolon_density` (warn)
- `H_passive_overuse` (warn)
- `H_judge_genuine_opinions` (warn)
- `H_judge_unexpected_phrasings` (warn)
- `H_judge_point_of_view` (warn)
- `H_judge_quotable_sentence` (warn)
- `H_judge_intro_earns_attention` (fail)
- `Q_intro_hook` (warn)
- `Q_specificity` (warn)

## Findings at this version (20)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (5)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~14 FAQ pairs
- `S_tldr_missing` — No TL;DR block (expected <p data-tldr> or paragraph starting with 'TL;DR:')
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_judge_sounds_like_a_specific_human` — Sounds like a specific human 3/10 — Mostly committee-speak with a few inserted 'human' lines that read as instructions to an editor rather …
- `H_judge_intro_earns_attention` — Intro earns attention 2/10 — Opens with a generic TL;DR definition and even leaks an editor note ('Replace anonymous editorial byline...').

### 🟡 warn (13)
- `D_Organization_missing_recommended` — Organization missing recommended: sameAs, contactPoint
- `D_WebPage_missing_recommended` — WebPage missing recommended: dateModified, primaryImageOfPage
- `S_visible_last_updated_missing` — No visible 'Last updated' / 'Last reviewed' / 'Next review' stamp on page (schema dateModified alone isn't enough for users or AI)
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_em_dash_overuse` — 12 em-dashes (3.73 per 400 words; target <1)
- `H_tricolon_density` — 10 tricolons (3.88/500 words; target ≤2)
- `H_passive_overuse` — Passive-voice ratio 18% (target <15%)
- `H_judge_genuine_opinions` — Genuine opinions 4/10 — A couple of opinionated lines exist but are drowned in generic safe claims.
- `H_judge_unexpected_phrasings` — Unexpected phrasings 4/10 — One fun Wikipedia-footnote line; the rest is boilerplate strings of nouns.
- `H_judge_point_of_view` — Point of view 4/10 — Mostly surveys both sides neutrally; rare POV flashes feel bolted on.
- `H_judge_quotable_sentence` — Quotable sentence 5/10 — The 'Wikipedia footnote nobody asked for' and 'no page two of ChatGPT' lines are quotable; most of the body isn't.
- `Q_intro_hook` — intro_hook 5/10 — The post opens with three competing 'definitions' in quick succession (TL;DR, inline def, Quick answer box) before any ge…
- `Q_specificity` — specificity 6/10 — The post has pockets of strong specificity—the Semrush 8,200-URL study, the 2.3x FAQPage citation lift, named schema typ…

## What we did this round

Applied **7** · Skipped **8** · Drift **1** · Ambiguous **2** · Escalated **2** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `P_faq_count_mismatch` | attempt_rewrite | ✅ applied | FAQPage rebuilt from 7 visible FAQ(s) |
| `S_tldr_missing` | attempt_rewrite | ➖ skipped | TL;DR already present |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_sounds_like_a_specific_human` | apply_patch | ✅ applied | replaced single occurrence (142b → 137b) |
| `H_judge_intro_earns_attention` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=TL;DR: Answer … |
| `D_Organization_missing_recommended` | insert_missing | ✅ applied | Organization enriched |
| `D_WebPage_missing_recommended` | insert_missing | ✅ applied | WebPage enriched |
| `S_visible_last_updated_missing` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `E_author_credentials_missing` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_em_dash_overuse` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_tricolon_density` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_passive_overuse` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_genuine_opinions` | apply_patch | ✅ applied | replaced single occurrence (97b → 117b) |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (167b → 129b) |
| `H_judge_point_of_view` | apply_patch | ⚠️ ambiguous | before string matches 2 locations — refusing to blind-replace |
| `H_judge_quotable_sentence` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `Q_intro_hook` | apply_patch | ⚠️ ambiguous | before string matches 2 locations — refusing to blind-replace |
| `Q_specificity` | apply_patch | ✅ applied | replaced single occurrence (72b → 248b) |

## 🔔 Open items as of this version

- **E_author_sameas_missing** (critical) → needs: `author.linkedin_url`
  - Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- **E_human_signals_bundle_incomplete** (critical) → needs: `author`, `first_party_data`, `named_examples`, `original_visuals`
  - Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-flag risk
- **E_no_first_party_data** (fail) → needs: `first_party_data`
  - no patch/before to rewrite

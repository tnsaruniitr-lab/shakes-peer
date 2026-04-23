# v2 — Audit Report

**Score:** 45/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 1 &nbsp;·&nbsp; **Cost:** $0.1743

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 13 |
| Humanization | 59 |
| Quality | 67 |
| **Overall** | **45** |

## Findings at this version (17)

### 🔴 critical (1)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)

### 🟠 fail (8)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~14 FAQ pairs
- `S_tldr_missing` — No TL;DR block (expected <p data-tldr> or paragraph starting with 'TL;DR:')
- `S_word_count_below_band` — 1033 words is below comparison minimum 1200 (target 1800)
- `H_judge_specific_human_voice` — Specific human voice 2/10 — Reads like marketing copy written by committee, with repetitive feature lists and no individual voice.
- `H_judge_genuine_opinions` — Genuine opinions 3/10 — Opinions are all self-serving promotional claims rather than nuanced takes; competitors get cardboard treatment.
- `H_judge_unexpected_phrasings` — Unexpected phrasings 3/10 — Phrasings are predictable ('herding your friends,' 'back-and-forth,' 'headache') with one 'herding' cliché as t…
- `H_judge_specific_citations` — Specific citations 3/10 — No actual prices, version numbers, dates, or named features — just vague placeholder citations like [wanderlog-si…
- `H_judge_quotable_sentence` — Quotable sentence 2/10 — Nothing memorable enough to text a friend; everything is generic feature-comparison language.

### 🟡 warn (8)
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, hasCredential
- `S_visible_last_updated_missing` — No visible 'Last updated' / 'Last reviewed' / 'Next review' stamp on page (schema dateModified alone isn't enough for users or AI)
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_tricolon_density` — 9 tricolons (3.22/500 words; target ≤2)
- `H_judge_point_of_view` — Point of view 5/10 — Has a clear POV (TRYPS wins) but it's so one-sided and self-promotional it undermines credibility rather than serving …
- `H_judge_intro_earns_attention` — Intro earns attention 4/10 — Opens with duplicated nav/title clutter and a generic rhetorical question; no hook or specificity.
- `Q_intro_hook` — intro_hook 6/10 — The two-sentence opener is a mild improvement over 'In today's world,' but it's still a familiar, abstract observation an…
- `Q_specificity` — specificity 5/10 — The post names the five apps correctly and gives per-app feature verdicts, which is good. But it relies heavily on repea…

## What we did this round

Applied **8** · Skipped **3** · Drift **6** · Ambiguous **0** · Escalated **2** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `S_word_count_below_band` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_specific_human_voice` | apply_patch | ✅ applied | replaced single occurrence (182b → 117b) |
| `H_judge_genuine_opinions` | apply_patch | ✅ applied | replaced single occurrence (156b → 138b) |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (121b → 118b) |
| `H_judge_specific_citations` | apply_patch | ✅ applied | replaced single occurrence (66b → 105b) |
| `H_judge_quotable_sentence` | apply_patch | ✅ applied | replaced single occurrence (122b → 122b) |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_judge_point_of_view` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_intro_earns_attention` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Blog Trip Plan… |
| `Q_intro_hook` | apply_patch | ↩️ drift | before string not found in html (patch type=rewrite_intro, target=The hardest p… |
| `Q_specificity` | apply_patch | ↩️ drift | before string not found in html (patch type=replace_span, target=Google's trave… |
| `P_faq_count_mismatch` | attempt_rewrite | ✅ applied | FAQPage rebuilt from 7 visible FAQ(s) |
| `S_tldr_missing` | attempt_rewrite | ✅ applied | TL;DR inserted (436 chars) |
| `D_Person_missing_recommended` | insert_missing | ➖ skipped | no patch envelope |
| `S_visible_last_updated_missing` | attempt_rewrite | ✅ applied | last-updated stamp inserted (2026-04-23) |
| `E_author_credentials_missing` | attempt_rewrite | 🔔 escalated | author.title and author.bio both absent in brief — caller must populate |

## 🔔 Open items as of this version

- **E_author_sameas_missing** (critical) → needs: `author.linkedin_url`
  - Author has no sameAs URLs (should link LinkedIn + at least one other profile)

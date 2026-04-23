# v3 — Audit Report

**Score:** 41/100 (target —) &nbsp;·&nbsp; **Verdict:** block &nbsp;·&nbsp; **Critical:** 2 &nbsp;·&nbsp; **Cost:** $0.1793

## Layer breakdown

| Layer | Score |
|-------|-------|
| Technical | 0 |
| Humanization | 63 |
| Quality | 63 |
| **Overall** | **41** |

## Compared to previous version

8 fixed · 14 still present · 0 regressed

### ✅ Fixed
- `S_tldr_missing` (was fail)
- `S_visible_last_updated_missing` (was warn)
- `S_missing_DefinedTerm_schema` (was fail)
- `H_judge_specific_human_voice_vs_committee` (was fail)
- `H_judge_genuine_opinions_vs_safe_claims` (was fail)
- `H_judge_specific_citations_(names,_prices,_dates` (was fail)
- `H_judge_point_of_view_vs_neutral_survey` (was fail)
- `H_judge_quotability` (was fail)

### ⚠️ Still present
- `D_WebSite_missing_recommended` (warn)
- `D_ImageObject_missing_recommended` (warn)
- `D_Person_missing_recommended` (warn)
- `P_faq_count_mismatch` (fail)
- `E_author_sameas_missing` (critical)
- `E_author_credentials_missing` (warn)
- `E_no_first_party_data` (fail)
- `E_human_signals_bundle_incomplete` (critical)
- `H_em_dash_overuse` (warn)
- `H_tricolon_density` (warn)
- `H_judge_unexpected_phrasings` (warn)
- `H_judge_intro_earns_attention` (fail)
- `Q_intro_hook` (warn)
- `Q_specificity` (warn)

## Findings at this version (20)

### 🔴 critical (2)
- `E_author_sameas_missing` — Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- `E_human_signals_bundle_incomplete` — Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-fl…

### 🟠 fail (4)
- `P_faq_count_mismatch` — FAQPage schema has 7 Questions but page shows ~13 FAQ pairs
- `E_no_first_party_data` — No first-party data signals ("we tested", "our data shows", "we analyzed"). Add at least one concrete observation
- `H_judge_sounds_like_a_specific_human` — Sounds like a specific human 3/10 — Mostly committee-voice with a few jarring first-person interjections that don't match the surrounding c…
- `H_judge_intro_earns_attention` — Intro earns attention 2/10 — Opens with boilerplate TL;DR, byline metadata, and a textbook definition—zero hook, reader has no reason to co…

### 🟡 warn (14)
- `D_WebSite_missing_recommended` — WebSite missing recommended: potentialAction
- `D_ImageObject_missing_recommended` — ImageObject missing recommended: creator, license
- `D_Person_missing_recommended` — Person missing recommended: jobTitle, sameAs, url, hasCredential
- `D_entity_missing_id` — Entity of type FAQPage has no @id — cross-page interconnection blocked
- `E_author_credentials_missing` — Author has no jobTitle or description — credentials not stated
- `H_em_dash_overuse` — 10 em-dashes (2.76 per 400 words; target <1)
- `H_tricolon_density` — 14 tricolons (4.84/500 words; target ≤2)
- `H_judge_genuine_opinions` — Genuine opinions 5/10 — A few spicy takes exist ('most AEO advice is recycled SEO') but they're drowned in safe, hedged claims.
- `H_judge_unexpected_phrasings` — Unexpected phrasings 5/10 — Magpie metaphor and 'cheapest-to-cite source' are fresh, but most sentences read like template filler.
- `H_judge_specific_citations` — Specific citations 6/10 — Has one concrete stat (34% more Perplexity citations, 90 days) and dated sources, but no named companies, people,…
- `H_judge_point_of_view` — Point of view 4/10 — Largely surveys the topic neutrally; the few opinionated lines feel bolted onto a balanced explainer.
- `H_judge_quotable_sentence` — Quotable sentence 5/10 — The magpie line and 'cheapest-to-cite source' are quotable, but they're surrounded by forgettable definitional pro…
- `Q_intro_hook` — intro_hook 5/10 — The post's actual opening sentences (after the metadata block) are a dry definitional statement and a table-of-contents p…
- `Q_specificity` — specificity 6/10 — The post has one strong specific data point (the Semrush 34% Perplexity citation lift over 90 days) but much of the tact…

## What we did this round

Applied **9** · Skipped **7** · Drift **5** · Ambiguous **0** · Escalated **3** · Failed **0**

| Check | Action | Outcome | Why |
|-------|--------|---------|-----|
| `E_author_sameas_missing` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `E_human_signals_bundle_incomplete` | human_fix_required | 🔔 escalated | human_fix_required (critical) |
| `P_faq_count_mismatch` | attempt_rewrite | ✅ applied | FAQPage rebuilt from 7 visible FAQ(s) |
| `E_no_first_party_data` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_sounds_like_a_specific_human` | apply_patch | ✅ applied | replaced single occurrence (239b → 160b) |
| `H_judge_intro_earns_attention` | apply_patch | ✅ applied | replaced single occurrence (202b → 170b) |
| `D_WebSite_missing_recommended` | insert_missing | ➖ skipped | no patch envelope |
| `D_ImageObject_missing_recommended` | insert_missing | ➖ skipped | no patch envelope |
| `D_Person_missing_recommended` | insert_missing | ➖ skipped | no patch envelope |
| `D_entity_missing_id` | insert_missing | ➖ skipped | no patch envelope |
| `E_author_credentials_missing` | attempt_rewrite | 🔔 escalated | author.title and author.bio both absent in brief — caller must populate |
| `H_em_dash_overuse` | apply_patch | ✅ applied | replaced single occurrence (690b → 691b) |
| `H_tricolon_density` | attempt_rewrite | ✅ applied | rewrote 349b → 317b |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_tricolon_density` | attempt_rewrite | ↩️ drift | before snippet no longer in html |
| `H_judge_genuine_opinions` | apply_patch | ✅ applied | replaced single occurrence (104b → 122b) |
| `H_judge_unexpected_phrasings` | apply_patch | ✅ applied | replaced single occurrence (209b → 130b) |
| `H_judge_specific_citations` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `H_judge_point_of_view` | apply_patch | ✅ applied | replaced single occurrence (142b → 95b) |
| `H_judge_quotable_sentence` | attempt_rewrite | ➖ skipped | no patch/before to rewrite |
| `Q_intro_hook` | apply_patch | ↩️ drift | before string not found in html (patch type=rewrite_intro, target=Answer Engine… |
| `Q_specificity` | apply_patch | ✅ applied | replaced single occurrence (111b → 281b) |

## 🔔 Open items as of this version

- **E_author_sameas_missing** (critical) → needs: `author.linkedin_url`
  - Author has no sameAs URLs (should link LinkedIn + at least one other profile)
- **E_human_signals_bundle_incomplete** (critical) → needs: `author`, `first_party_data`, `named_examples`, `original_visuals`
  - Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-flag risk
- **E_no_first_party_data** (fail) → needs: `first_party_data`
  - no patch/before to rewrite

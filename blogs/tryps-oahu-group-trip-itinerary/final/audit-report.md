# Final Audit Report — tryps-oahu-group-trip-itinerary

**Terminal:** 🔔 needs editorial review &nbsp;·&nbsp; **Final score:** 46/100 &nbsp;·&nbsp; **Rounds:** 4 &nbsp;·&nbsp; **Cost:** $0.7673

_Auditor: blog-buster v0.1.6 @ da64c69_

> reached maxRounds=3 with 8 open item(s) for editorial review

## TL;DR

- Score regressed **50 → 46** (-4 points)
- **11 fixes applied** across 4 rounds
- **4 open item(s)** needing editorial input
- **11 critical escalation(s)** during the run

## Score progression

| Version | Score | Technical | Humanization | Quality | Critical | Applied this round |
|---------|-------|-----------|--------------|---------|----------|--------------------|
| v1 | — | — | — | — | — | 0 |
| v2 | 50 | 0 | 76 | 80 | 2 | 6 |
| v3 | 50 | 0 | 76 | 80 | 3 | 3 |
| v4 | 49 | 0 | 76 | 73 | 3 | 2 |
| v5 | 46 | 0 | 73 | 67 | 3 | 0 |

## 🔔 Open items — needs human input

These cannot be auto-fixed because they require real human data. Fill the suggested brief fields and re-run to close them.

### E_author_sameas_missing

- **Severity:** critical
- **First seen:** v2 · **Last seen:** v4
- **Brief fields to populate:** `author.linkedin_url`
- **Evidence:** Author has no sameAs URLs (should link LinkedIn + at least one other profile)

### E_human_signals_bundle_incomplete

- **Severity:** critical
- **First seen:** v2 · **Last seen:** v4
- **Brief fields to populate:** `author`, `first_party_data`, `named_examples`, `original_visuals`
- **Evidence:** Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true, 3+ citations=true). High AI-content-flag risk

### E_no_first_party_data

- **Severity:** fail
- **First seen:** v2 · **Last seen:** v4
- **Brief fields to populate:** `first_party_data`
- **Evidence:** no patch/before to rewrite

### V_schema_invalid_json

- **Severity:** critical
- **First seen:** v3 · **Last seen:** v4
- **Brief fields to populate:** —
- **Evidence:** JSON-LD block #1 failed to parse: Bad control character in string literal in JSON at position 7831 (line 224 column 32). Downstream schema checks cannot run on this block.

## Where to find everything

- Final blog (markdown): [`./index.md`](./index.md)
- Final blog (HTML): [`./index.html`](./index.html)
- Full audit JSON: [`./audit.full.json`](./audit.full.json)
- Per-version reports: `../v1/audit-report.md`, `../v2/audit-report.md`, …
- Per-blog dashboard: [`../README.md`](../README.md)
- Machine-readable timeline: [`../history.json`](../history.json)

_Generated 2026-04-23T09:44:01.519Z_
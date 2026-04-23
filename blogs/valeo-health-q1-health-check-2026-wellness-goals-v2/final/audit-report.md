# Final Audit Report — valeo-health-q1-health-check-2026-wellness-goals-v2

**Terminal:** 🔔 needs editorial review &nbsp;·&nbsp; **Final score:** 50/100 &nbsp;·&nbsp; **Rounds:** 4 &nbsp;·&nbsp; **Cost:** $0.6699

_Auditor: blog-buster v0.1.6 @ da64c69_

> reached maxRounds=3 with 6 open item(s) for editorial review

## TL;DR

- Score improved **42 → 50** (+8 points)
- **23 fixes applied** across 4 rounds
- **3 open item(s)** needing editorial input
- **9 critical escalation(s)** during the run

## Score progression

| Version | Score | Technical | Humanization | Quality | Critical | Applied this round |
|---------|-------|-----------|--------------|---------|----------|--------------------|
| v1 | — | — | — | — | — | 0 |
| v2 | 42 | 0 | 60 | 73 | 2 | 10 |
| v3 | 47 | 0 | 71 | 73 | 2 | 7 |
| v4 | 48 | 0 | 75 | 70 | 2 | 6 |
| v5 | 50 | 0 | 80 | 70 | 2 | 0 |

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

## Where to find everything

- Final blog (markdown): [`./index.md`](./index.md)
- Final blog (HTML): [`./index.html`](./index.html)
- Full audit JSON: [`./audit.full.json`](./audit.full.json)
- Per-version reports: `../v1/audit-report.md`, `../v2/audit-report.md`, …
- Per-blog dashboard: [`../README.md`](../README.md)
- Machine-readable timeline: [`../history.json`](../history.json)

_Generated 2026-04-23T09:32:56.533Z_
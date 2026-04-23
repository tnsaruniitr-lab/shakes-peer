# valeo-health-q1-health-check-2026-wellness-goals-v5

**Terminal:** 🔔 needs editorial review &nbsp; **Cost:** $0.7558 &nbsp; **Versions:** 5 &nbsp; **Open items:** 3
_Auditor: blog-buster v0.1.6 @ da64c69_
_Brand data: Brandsmith brand #5 (Valeo Health) — no fields filled (caller provided everything)_

> reached maxRounds=3 with 6 open item(s) for editorial review

## 🔔 Open items — editorial review needed

These findings can't be auto-fixed because they require real human data (author credentials, first-party research, named examples, original visuals). The blog still ships with every auto-fixable improvement applied; these are tracked so an editor can resolve them before publish.

| Check | Severity | First seen | Last seen | Evidence | Suggested fields |
|-------|----------|------------|-----------|----------|------------------|
| E_author_sameas_missing | critical | v2 | v4 | Author has no sameAs URLs (should link LinkedIn + at least one other profile) | `author.linkedin_url` |
| E_human_signals_bundle_incomplete | critical | v2 | v4 | Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true… | `author`, `first_party_data`, `named_examples`, `original_visuals` |
| E_no_first_party_data | fail | v2 | v4 | no patch/before to rewrite | `first_party_data` |

## Score progression

| Version | Score | Technical | Humanization | Quality | Critical | Verdict | Cost | Inner iter | Commit |
|---------|-------|-----------|--------------|---------|----------|---------|------|------------|--------|
| v1 | — | — | — | — | — | — | $0.0000 | 0 | 879573c |
| v2 | 42 | 0 | 62 | 70 | 2 | block | $0.1931 | 1 | 1d7f040 |
| v3 | 44 | 0 | 71 | 63 | 2 | block | $0.1941 | 1 | 178f90b |
| v4 | 47 | 0 | 75 | 67 | 2 | block | $0.1826 | 1 | 9a21494 |
| v5 | 48 | 0 | 76 | 70 | 2 | block | $0.1860 | 1 | — |

## Handler activity per round

| Version | Applied | Skipped | Drift | Ambiguous | Escalated | Failed |
|---------|---------|---------|-------|-----------|-----------|--------|
| v2 | 10 | 3 | 1 | 0 | 3 | 0 |
| v3 | 7 | 6 | 1 | 0 | 3 | 0 |
| v4 | 4 | 6 | 3 | 0 | 3 | 0 |

_Last updated: 2026-04-23T12:02:25.778Z_
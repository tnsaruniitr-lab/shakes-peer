# valeo-health-q1-health-check-2026-wellness-goals-v3

**Terminal:** 🔔 needs editorial review &nbsp; **Cost:** $0.7030 &nbsp; **Versions:** 5 &nbsp; **Open items:** 3
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
| v1 | — | — | — | — | — | — | $0.0000 | 0 | 007f08b |
| v2 | 41 | 0 | 59 | 70 | 2 | block | $0.1832 | 1 | 675e0b0 |
| v3 | 49 | 0 | 74 | 77 | 2 | block | $0.1724 | 1 | 4090ba3 |
| v4 | 47 | 0 | 73 | 70 | 2 | block | $0.1739 | 1 | 3fb9977 |
| v5 | 46 | 0 | 72 | 70 | 2 | block | $0.1736 | 1 | — |

## Handler activity per round

| Version | Applied | Skipped | Drift | Ambiguous | Escalated | Failed |
|---------|---------|---------|-------|-----------|-----------|--------|
| v2 | 9 | 3 | 2 | 0 | 3 | 0 |
| v3 | 6 | 5 | 0 | 0 | 3 | 0 |
| v4 | 7 | 4 | 4 | 0 | 3 | 0 |

_Last updated: 2026-04-23T10:05:16.474Z_
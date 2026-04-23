# answermonk-what-is-answer-engine-optimization-v2

**Terminal:** 🔔 needs editorial review &nbsp; **Cost:** $0.6358 &nbsp; **Versions:** 5 &nbsp; **Open items:** 3
_Auditor: blog-buster v0.1.6 @ da64c69_

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
| v1 | — | — | — | — | — | — | $0.0000 | 0 | 7c6bb15 |
| v2 | 35 | 0 | 52 | 57 | 2 | block | $0.1671 | 1 | 74d9546 |
| v3 | 45 | 0 | 66 | 73 | 2 | block | $0.1709 | 1 | 18e4128 |
| v4 | 46 | 0 | 68 | 77 | 2 | block | $0.1491 | 1 | 227f071 |
| v5 | 47 | 0 | 71 | 73 | 2 | block | $0.1488 | 1 | — |

## Handler activity per round

| Version | Applied | Skipped | Drift | Ambiguous | Escalated | Failed |
|---------|---------|---------|-------|-----------|-----------|--------|
| v2 | 12 | 3 | 6 | 0 | 3 | 0 |
| v3 | 8 | 4 | 5 | 0 | 3 | 0 |
| v4 | 5 | 7 | 5 | 0 | 3 | 0 |

_Last updated: 2026-04-23T07:29:27.671Z_
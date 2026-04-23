# answermonk-what-is-answer-engine-optimization

**Terminal:** 🔔 needs editorial review &nbsp; **Cost:** $0.3295 &nbsp; **Versions:** 3 &nbsp; **Open items:** 3

> reached maxRounds=2 with 4 open item(s) for editorial review

## 🔔 Open items — editorial review needed

These findings can't be auto-fixed because they require real human data (author credentials, first-party research, named examples, original visuals). The blog still ships with every auto-fixable improvement applied; these are tracked so an editor can resolve them before publish.

| Check | Severity | First seen | Last seen | Evidence | Suggested fields |
|-------|----------|------------|-----------|----------|------------------|
| E_author_sameas_missing | critical | v2 | v3 | Author has no sameAs URLs (should link LinkedIn + at least one other profile) | `author.linkedin_url` |
| E_human_signals_bundle_incomplete | critical | v2 | v3 | Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true… | `author`, `first_party_data`, `named_examples`, `original_visuals` |
| E_no_first_party_data | fail | v2 | v3 | no patch/before to rewrite | `first_party_data` |

## Score progression

| Version | Score | Technical | Humanization | Quality | Critical | Verdict | Cost | Inner iter | Commit |
|---------|-------|-----------|--------------|---------|----------|---------|------|------------|--------|
| v1 | — | — | — | — | — | — | $0.0000 | 0 | b351184 |
| v2 | 36 | 0 | 46 | 70 | 2 | block | $0.1648 | 1 | db7d6e6 |
| v3 | 39 | 0 | 59 | 63 | 2 | block | $0.1648 | 1 | 0ef846a |

## Handler activity per round

| Version | Applied | Skipped | Drift | Ambiguous | Escalated | Failed |
|---------|---------|---------|-------|-----------|-----------|--------|
| v2 | 11 | 6 | 0 | 3 | 2 | 0 |
| v3 | 7 | 8 | 1 | 2 | 2 | 0 |

_Last updated: 2026-04-23T04:58:32.865Z_
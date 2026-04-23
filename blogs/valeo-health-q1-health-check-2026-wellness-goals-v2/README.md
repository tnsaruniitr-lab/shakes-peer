# valeo-health-q1-health-check-2026-wellness-goals-v2

**Terminal:** 🔔 needs editorial review &nbsp; **Cost:** $0.6699 &nbsp; **Versions:** 5 &nbsp; **Open items:** 3
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
| v1 | — | — | — | — | — | — | $0.0000 | 0 | eeeb199 |
| v2 | 42 | 0 | 60 | 73 | 2 | block | $0.1715 | 1 | 3f2a504 |
| v3 | 47 | 0 | 71 | 73 | 2 | block | $0.1721 | 1 | 073714d |
| v4 | 48 | 0 | 75 | 70 | 2 | block | $0.1760 | 1 | 9904724 |
| v5 | 50 | 0 | 80 | 70 | 2 | block | $0.1504 | 1 | — |

## Handler activity per round

| Version | Applied | Skipped | Drift | Ambiguous | Escalated | Failed |
|---------|---------|---------|-------|-----------|-----------|--------|
| v2 | 10 | 2 | 1 | 0 | 3 | 0 |
| v3 | 7 | 4 | 1 | 0 | 3 | 0 |
| v4 | 6 | 5 | 1 | 0 | 3 | 0 |

_Last updated: 2026-04-23T09:32:56.533Z_
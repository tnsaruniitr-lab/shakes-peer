# tryps-oahu-group-trip-itinerary-clean

**Terminal:** 🔔 needs editorial review &nbsp; **Cost:** $0.8028 &nbsp; **Versions:** 5 &nbsp; **Open items:** 4
_Auditor: blog-buster v0.1.6 @ da64c69_
_Brand data: Brandsmith brand #2 (tryps) — no fields filled (caller provided everything)_

> reached maxRounds=3 with 8 open item(s) for editorial review

## 🔔 Open items — editorial review needed

These findings can't be auto-fixed because they require real human data (author credentials, first-party research, named examples, original visuals). The blog still ships with every auto-fixable improvement applied; these are tracked so an editor can resolve them before publish.

| Check | Severity | First seen | Last seen | Evidence | Suggested fields |
|-------|----------|------------|-----------|----------|------------------|
| E_author_sameas_missing | critical | v2 | v4 | Author has no sameAs URLs (should link LinkedIn + at least one other profile) | `author.linkedin_url` |
| E_human_signals_bundle_incomplete | critical | v2 | v4 | Only 3/4 human signals present (author+LinkedIn=false, first-party data=false, original visual=true… | `author`, `first_party_data`, `named_examples`, `original_visuals` |
| E_no_first_party_data | fail | v2 | v4 | no patch/before to rewrite | `first_party_data` |
| V_schema_invalid_json | critical | v3 | v4 | JSON-LD block #1 failed to parse: Bad control character in string literal in JSON at position 7864 … | — |

## Score progression

| Version | Score | Technical | Humanization | Quality | Critical | Verdict | Cost | Inner iter | Commit |
|---------|-------|-----------|--------------|---------|----------|---------|------|------------|--------|
| v1 | — | — | — | — | — | — | $0.0000 | 0 | d2ec1c0 |
| v2 | 50 | 0 | 75 | 80 | 2 | block | $0.2004 | 1 | 0e1f275 |
| v3 | 45 | 0 | 68 | 70 | 3 | block | $0.1960 | 1 | 6f39b95 |
| v4 | 46 | 0 | 66 | 80 | 3 | block | $0.2022 | 1 | f6d2c43 |
| v5 | 46 | 0 | 66 | 80 | 3 | block | $0.2042 | 1 | — |

## Handler activity per round

| Version | Applied | Skipped | Drift | Ambiguous | Escalated | Failed |
|---------|---------|---------|-------|-----------|-----------|--------|
| v2 | 8 | 4 | 1 | 0 | 3 | 0 |
| v3 | 6 | 8 | 1 | 0 | 4 | 0 |
| v4 | 4 | 8 | 2 | 0 | 4 | 0 |

_Last updated: 2026-04-23T09:49:43.017Z_
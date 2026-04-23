# tryps-oahu-group-trip-itinerary-v2

**Terminal:** 🔔 needs editorial review &nbsp; **Cost:** $0.7305 &nbsp; **Versions:** 5 &nbsp; **Open items:** 4
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
| V_schema_invalid_json | critical | v3 | v4 | JSON-LD block #1 failed to parse: Bad control character in string literal in JSON at position 7793 … | — |

## Score progression

| Version | Score | Technical | Humanization | Quality | Critical | Verdict | Cost | Inner iter | Commit |
|---------|-------|-----------|--------------|---------|----------|---------|------|------------|--------|
| v1 | — | — | — | — | — | — | $0.0000 | 0 | 5b87849 |
| v2 | 50 | 0 | 78 | 77 | 2 | block | $0.1683 | 1 | 2950bba |
| v3 | 50 | 0 | 76 | 80 | 3 | block | $0.1833 | 1 | 8eca637 |
| v4 | 49 | 0 | 73 | 80 | 3 | block | $0.1908 | 1 | 8b22663 |
| v5 | 50 | 0 | 76 | 80 | 3 | block | $0.1881 | 1 | — |

## Handler activity per round

| Version | Applied | Skipped | Drift | Ambiguous | Escalated | Failed |
|---------|---------|---------|-------|-----------|-----------|--------|
| v2 | 7 | 5 | 0 | 0 | 3 | 0 |
| v3 | 4 | 6 | 1 | 0 | 4 | 0 |
| v4 | 5 | 5 | 1 | 1 | 4 | 0 |

_Last updated: 2026-04-23T09:54:27.682Z_
# Shakes-peer ↔ Blog-buster Handshake Contract

**Version:** 0.1 (draft, Phase 0)
**Status:** Awaiting blog-buster team sign-off on §3 (rule-authority matrix) and §4 (open items)
**Owners:** Shakes-peer (writer + A/B/C checks) · Blog-buster (EEAT, schema, humanization, quality, lineage, fix plan)

This document defines the machine-readable contract between Shakes-peer (the blog writer) and blog-buster (the external auditor). It is the single source of truth for:

- Which checks each system owns
- The JSON shapes of the request and response
- The fix-action taxonomy
- Terminal states and loop semantics
- Idempotence expectations
- Filesystem and versioning policies

If either side violates any rule in this document it is a **contract violation**, not a finding — the operator halts the loop and resolves before continuing.

---

## 1. Operational model

```
┌─────────────────────────────────────────────────────────┐
│ Shakes-peer (writer)                                    │
│  • Generates HTML + JSON-LD + markdown                  │
│  • Runs pre-flight audit over its 14 kept checks        │
│  • Loads priorRuns from Supabase `audit_lineage`        │
│  • Calls blog-buster.audit(opts) in-process             │
│  • Receives AuditResult                                 │
│  • Dispatches instructions to content-level handlers    │
│  • Persists audit_lineage row, loops or stops           │
└─────────────────────────────────────────────────────────┘
                         ↕  in-process function call
┌─────────────────────────────────────────────────────────┐
│ Blog-buster (auditor, called as a library)              │
│  • Runs 40+ deterministic checks (technical/EEAT/human) │
│  • Runs LLM judge layers (humanization + quality)       │
│  • Produces shakespeerInstructions[] (fix plan)         │
│  • Applies its own inner patches + rewrites (5 iters)   │
│  • Compares against priorRuns for regression detection  │
│  • Returns AuditResult { verdict, instructions, ... }   │
└─────────────────────────────────────────────────────────┘
```

**Phase A (production):** same diagram, bundled into one Railway service. In-process stays.

**Phase B (later):** blog-buster becomes a separate HTTP service. The JSON contract in this document crosses the network boundary unchanged.

---

## 2. Loop topology

Two nested loops, responsibilities cleanly split.

### 2.1 Inner loop — owned by blog-buster

- Runs **inside one `audit()` call**
- Applies deterministic patches (banned phrases, meta fixes, schema field edits)
- Applies LLM rewrites (prose quality, humanization)
- Re-scores after each iteration
- Stops on: `ship` verdict, max 5 iterations, cost cap, stall, or unfixable critical

### 2.2 Outer loop — owned by shakes-peer

- Runs **across multiple `audit()` calls**, up to 3 rounds
- Applies content-level operations blog-buster can't do alone:
  - Insert a TL;DR paragraph (`<p data-tldr>`)
  - Insert an editorial-stance banner (`<aside class="editorial-stance">`)
  - Insert a first-party-data paragraph
  - Insert a visible "Last reviewed / Next review" stamp
  - Re-run the writer to regenerate a failing section
- Stops on: `ship`, `block`, `isFinal`, or `regressions.length > 2`
- Persists each round to Supabase `audit_lineage`

Most blogs converge inside blog-buster's inner loop without ever needing an outer round.

---

## 3. Rule-authority matrix

Each check is owned by exactly one system. Both systems may inspect the same artifact, but only the authority's verdict binds the loop. Overlapping rules are marked `deprecated: true` in the losing side's catalog with a pointer to the canonical rule.

### 3.1 Shakes-peer kept checks (authority: `shakespeer`)

These stay in `rules/blog-rules.json` and `src/blog/auditor.ts`. They run as **preflight**, injected into `audit()` via the `preflight` field.

| Rule ID | Title | Why unique |
|---------|-------|-----------|
| A1 | Primary keyword appears in title or H1 | Blog-buster has no keyword-placement check |
| A4 | Slug is concise and keyword-relevant | Voice/brand concern |
| B1 | Post includes a fast-answer (TL;DR) block | Specific to our `<p data-tldr>` convention |
| B5 | A clear next step or CTA is present | We render the CTA |
| C3 | Inline citation anchors resolve to reference targets | Specific to our citation emit convention |
| C4 | Primary keyword + intent embedded as HTML data attrs | Our `data-*` convention |
| E1 | Factual paragraphs are source-backed | Per-paragraph citation attribution — not in blog-buster |
| E2 | Provided sources are actually used | Source-inventory hygiene check |
| E4 | Brand mentions feel integrated rather than stuffed | Requires brand context |
| E5 | Article closes with a synthesized conclusion | Our format convention |
| F2 | Article contains first-party data signals | Our regex is broader than blog-buster's (preflight-only; blog-buster confirms/rejects) |
| F4 | Article renders an editorial-stance banner | Specific DOM element (`<aside class="editorial-stance">`) |
| F5 | Original visual placeholder is resolved | Our placeholder convention + publish gate |
| F6 | 3+ primary-tier citations present | Blog-buster checks count; we check `authority_tier` tags |

**Total kept: 14.** Weights recompute to sum to 100 after retirement (previously 125 with Section F weight 25 + overlaps).

### 3.2 Retired checks (authority: `blog-buster`)

These stay in `rules/blog-rules.json` marked `deprecated: true` with a `superseded_by` pointer. `auditor.ts` removes the check implementation; snapshot tests get updated accordingly.

| Retired | Superseded by | Notes |
|---------|--------------|-------|
| A2 meta title 45–65 chars | `blog-buster:M_title_length` | |
| A3 meta description 140–165 chars | `blog-buster:M_description_length` | |
| A5 topical depth | `blog-buster:quality.specificity` | Quality-judge axis |
| B2 question-form H2 ratio | `blog-buster:S_h2_question_ratio_low` | Pending coverage confirm |
| B3 reader-retention elements | `blog-buster:technical` structural checks | |
| B4 paragraph concision | `blog-buster:humanization.paragraph-metrics` | |
| C1 single `<article>` + single `<h1>` | `blog-buster:T_h1_missing` + `T_h1_multiple` | |
| C2 heading hierarchy clean | `blog-buster:T_heading_hierarchy_gap` | |
| C5 JSON-LD script present | `blog-buster:D_no_schema_blocks` | |
| D1 BlogPosting node | `blog-buster:D_no_article_entity` | |
| D2 BlogPosting required fields | `blog-buster:D_BlogPosting_missing_required` | |
| D3 FAQPage schema when FAQs present | `blog-buster:D_faq_*` | |
| D4 Sources modeled as citations | `blog-buster:D_*` schema checks | |
| D5 about/mentions for entities | `blog-buster:D_entity_missing_id` | |
| D6 Format-specific schema | `blog-buster:D_*` per type | |
| E3 Concrete specifics | `blog-buster:quality.specificity` | |
| F1 Author sameAs LinkedIn | `blog-buster:E_author_person_missing` + `E_author_sameas_missing` | |
| F3 Named brands not generic | `blog-buster:humanization.banned-vocabulary` + `quality` | |
| F7 Visible Last Reviewed + Next Review | `blog-buster:S_visible_last_updated_missing` | Pending coverage confirm |
| F8 Banned AI-tell phrases | `blog-buster:H_banned_vocabulary` + `H_banned_phrases` | Blog-buster's list is richer |

**Total retired: 20.**

### 3.3 Pending verification

The blog-buster team claimed coverage for three of our rules. These need verification during Phase 1 smoke test:

- `S_h2_question_ratio_low` — verify the 40% threshold matches our B2
- `S_visible_last_updated_missing` — verify it also catches the "Next review" stamp
- `E_no_first_party_data` — known to have a narrower regex than our F2; we keep F2 as preflight-only

If any of these don't actually cover our check, move back to the kept list.

---

## 4. Open items requiring sign-off

Neither team starts Phase 2 work until these are answered:

1. **Preflight encoding:** confirm the exact shape of the `preflight: Finding[]` field blog-buster will accept (target: `AuditOptions.preflight`).
2. **Regression semantics:** when blog-buster sees a prior-run finding now missing, does it mark `fixed`? If the check itself was retired between runs, how is that handled (don't mark as regression)?
3. **`isFinal` + `verdict` combinations:** if v3 reaches a `ship` verdict, does blog-buster still write a FINAL artifact? Or only when v3 falls short of target?
4. **Cost-cap escape:** if `budget_exceeded` triggers mid-loop with no fixes applied, what's our retry/backoff policy?
5. **Temperature pin timing:** is the fix in blog-buster `v0.1.1` or gated behind an option flag?

---

## 5. Request contract — `AuditOptions`

We build this on every call:

```ts
interface AuditOptions {
  generatedPost: BloggerPost;            // required (§5.1)
  priorRuns?: PriorRun[];                // from our audit_lineage table
  version?: number;                      // priorRuns.length + 1 (explicit, not inferred)
  preflight?: Finding[];                 // our kept-rule findings (§3.1)
  runLlmLayers: boolean;                 // true in the outer loop
  repoRoot: string;                      // always absolute path, never inferred
  outputDir: string;                     // .audit-cache/<request-id>/ — gitignored
  publishToLocal: false;                 // we handle Desktop saves ourselves
  publishToRepo: false;                  // we handle repo saves ourselves
  commit: false;                         // no git ops from blog-buster
  targetScore?: number;                  // default 90
  scoreWeights?: { technical: number; humanization: number; quality: number };
}
```

### 5.1 `BloggerPost` — what blog-buster consumes

```ts
interface BloggerPost {
  slug: string;
  brand: { name: string; website?: string };
  html: string;                          // full page HTML
  articleBodyHtml?: string;              // inner <article> or <main>
  jsonLdSchemas?: unknown[];             // flat array, NOT @graph-wrapped
  metaTags?: Record<string, unknown>;    // og:title / twitter:card / description — flat keys
  topic?: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  format?: string;                       // "how-to" | "comparison" | "pillar" | ...
  wordCount?: number;
}
```

The Shakes-peer → BloggerPost adapter (`src/blog/blog-buster-adapter.ts`) unwraps our `@graph` into a flat schema array, extracts meta tags from rendered HTML, and slices out the article body. Adapter is idempotent and tested against 6 generated packages.

### 5.2 `Finding` — preflight encoding

```ts
interface Finding {
  check_id: string;                      // namespaced: "shakespeer:A1"
  severity: "critical" | "fail" | "warn" | "info";
  evidence: string;                      // what we saw
  suggested_fix?: string;                // our exact_fix string (for context only)
  authority: "shakespeer" | "blog-buster" | "shared";
}
```

Blog-buster uses this to:

- **Confirm**: if its own detector agrees → promote to `confirmed_findings` in response (two-witness signal).
- **Reject**: if it disagrees → add to `rejected_findings` with a reason.
- **Extend**: findings we didn't have but blog-buster detects → added as `new_findings`.

---

## 6. Response contract — `AuditResult`

```ts
interface AuditResult {
  version: number;                       // echoes options.version (or priorRuns.length + 1)
  isFinal: boolean;                      // true at v3+ regardless of verdict
  verdict: "ship" | "edit" | "block";
  verdictReason: string;                 // human-readable
  finalScore: number;                    // weighted 0–100
  criticalCount: number;
  iterationsCount: number;               // blog-buster's inner loop count
  totalCostUsd: number;
  status: "shipped" | "escalated" | "stalled" | "budget_exceeded" | "error";
  stopReason: string;
  shakespeerInstructions: ShakespeerInstructionsPayload;  // §7
  humanSummary: AuditHumanSummary;
  paragraphMetrics: ParagraphMetric[];
  priorIssues: PriorIssueStatus[];
  regressions: PriorIssueStatus[];
  publishedLocations: PublishResult["locations"];
  fullReport: AuditReport;
  confirmedFindings: string[];           // preflight IDs both systems agree on
  rejectedFindings: Array<{ check_id: string; reason: string }>;
}
```

---

## 7. Fix plan — `ShakespeerInstructionsPayload`

Blog-buster emits one of **5 action types** per instruction. Anything else is a contract violation and aborts the loop.

```ts
interface ShakespeerInstruction {
  check_id: string;                      // namespaced
  severity: "critical" | "fail" | "warn" | "info";
  layer: string;                         // "technical" | "eeat" | "humanization" | "quality"
  evidence: string;                      // what to show the rewriter / operator
  action:
    | "apply_patch"                      // §7.1 — string replace
    | "edit_schema"                      // §7.2 — meta tag or JSON-LD field edit
    | "insert_missing"                   // §7.3 — structural insertion
    | "attempt_rewrite"                  // §7.4 — LLM rewrite
    | "human_fix_required";              // §7.5 — escalate
  patch?: ShakespeerPatchEnvelope;       // present for non-human actions
}

interface ShakespeerPatchEnvelope {
  type:
    | "replace_span"
    | "insert_schema"
    | "rewrite_paragraph"
    | "rewrite_intro"
    | "meta_tag_edit"
    | "regex_replace";
  target: string;                        // selector, path, or regex
  before: string;                        // exact content expected
  after: string;                         // replacement (for simple patches)
  rationale: string;                     // why this patch
}
```

### 7.1 `apply_patch` — responsibility: shared

Simple string replacement on the HTML. **Blog-buster pre-scans for duplicate `before` occurrences and rejects ambiguous patches.** Shakes-peer still re-validates the snippet at apply time (drift guard).

### 7.2 `edit_schema` — responsibility: blog-buster (after builder's patcher upgrade)

Modifies a meta tag value or JSON-LD field. Blog-buster's own patcher applies this inside its inner loop; Shakes-peer only sees the result after the final iteration.

### 7.3 `insert_missing` — responsibility split

Split at the schema-vs-content seam:

- **Schema-level inserts** (e.g., missing BlogPosting node, missing FAQPage schema) → blog-buster's patcher.
- **Content-level inserts** (TL;DR paragraph, editorial stance banner, visible Last-Updated stamp, first-party data paragraph) → shakes-peer's handler.

### 7.4 `attempt_rewrite` — responsibility: shakes-peer

Blog-buster flags a span that needs LLM rewriting. Shakes-peer calls Claude/OpenAI with the evidence context, validates the rewrite against the failing check, applies if valid, retries on JSON-parse failure.

### 7.5 `human_fix_required` — responsibility: escalation

Neither system can auto-fix. Common cases:
- Author missing a real LinkedIn URL
- Original screenshot not uploaded
- Factual claim contradicted by the cited source

Shakes-peer surfaces to the operator (email, Telegram, UI) and breaks the loop.

---

## 8. Terminal states

Exact semantics, both sides must agree:

| Verdict | `isFinal` | Trigger | Outer-loop next step |
|---------|-----------|---------|----------------------|
| `ship` | any | `finalScore >= targetScore` AND `criticalCount == 0` | Publish. Done. |
| `edit` | `false` | Score below target, no blockers | Apply instructions, regenerate, call `audit()` again |
| `edit` | `true` | v3 reached, but score could improve | Stop anyway. Lock. Escalate to human for review. |
| `block` | any | ≥1 critical without an `apply_patch` (needs human) | Stop. Escalate. |
| `regression_spike` | any | `regressions.length > 2` in outer round | Stop. Roll back. Escalate. |
| `budget_exceeded` | any | Total cost > cap | Stop. Operator decides. |
| `error` | any | Unhandled exception in blog-buster | Stop. Log. Escalate. |

**Shakes-peer outer-loop stops on:** `ship`, `block`, `isFinal`, `regression_spike`, `budget_exceeded`, `error`, or `loop_exhausted` (after 3 rounds).

---

## 9. Severity vs tier policy

A rule's severity must be consistent with its determinism tier.

| Severity | Allowed tiers | Blocks publish? |
|----------|---------------|-----------------|
| CRITICAL | 1–5 (DOM, schema, count, API, string match) | Yes |
| HIGH | 1–7 (NLP and LLM-judge allowed) | Only for pillars; authors can override with reason |
| MEDIUM | any | No |
| LOW | any | No |

**Violations:** if blog-buster marks a tier 7 LLM-judge finding as CRITICAL, shakes-peer halts the loop and logs a contract violation. This prevents subjective judgment from silently blocking publish.

---

## 10. Idempotence contract

Both sides commit to deterministic output on identical inputs, with documented exceptions:

- Blog-buster pins Claude `temperature: 0` and uses `cache_control: {type: "ephemeral"}` on system prompts. (Builder fix, tracked in §4.5)
- Shakes-peer's adapter is a pure function (no `Date.now()`, no random).
- Timestamps in audit reports will differ run-to-run — ignored for equivalence testing (normalized out in snapshot tests).
- LLM rewrite token output will differ in length but score consistency is expected.

**Testable guarantee:** running the same blog through blog-buster twice, with LLM layers enabled, should produce identical `verdict`, identical `criticalCount`, and `finalScore` within ±2 points. Tighter on deterministic-only runs (exact match).

---

## 11. Filesystem policy

### 11.1 Shakes-peer writes

- **Repo** (`blogs/<slug>.md`, `examples/generated/*.{html,jsonld.json,package.json}`) — auto-committed + pushed via `.claude/auto-sync.sh`.
- **Desktop** (`~/Desktop/shakes-peer/blogs/<brand>-<slug>/`) — developer convenience; not part of the contract.

### 11.2 Blog-buster writes

- **ONLY** to the `outputDir` shakes-peer provides — nowhere else.
- Default: `.audit-cache/<brand-slug>/<post-slug>/<iso-timestamp>/`.
- Gitignored via `.gitignore` entries `.audit-cache/` and `audit-reports/`.
- `publishToLocal: false`, `publishToRepo: false`, `commit: false` — **always**. These are contract defaults, not options.

### 11.3 Version lineage

- Canonical history: **Supabase `audit_lineage` table** (per §12).
- Blog-buster's on-disk `.audit-cache/` is ephemeral debug output — may be cleaned per request, not relied on for state.
- Blog-buster gets lineage via `options.priorRuns`, fetched from Supabase by shakes-peer before each call.

---

## 12. Audit lineage schema (Supabase)

```sql
CREATE TABLE audit_lineage (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id             uuid NOT NULL,
  brand_slug          text NOT NULL,
  post_slug           text NOT NULL,
  version             int NOT NULL,
  external_audit_id   text,
  verdict             text CHECK (verdict IN ('ship','edit','block','isFinal','regression_spike','budget_exceeded','error','loop_exhausted')),
  final_score         numeric,
  critical_count      int,
  iterations_used     int,
  cost_usd            numeric,
  preflight_findings  jsonb,
  external_findings   jsonb,
  confirmed_findings  jsonb,
  rejected_findings   jsonb,
  fix_plan            jsonb,
  regressions         jsonb,
  terminal            boolean,
  rules_version       text,
  blog_buster_version text,
  created_at          timestamptz DEFAULT now(),
  UNIQUE(brand_slug, post_slug, version)
);

CREATE INDEX idx_audit_lineage_slug ON audit_lineage (brand_slug, post_slug, version DESC);
```

Every audit call inserts one row. Version numbers monotonically increase per `(brand_slug, post_slug)`.

---

## 13. Error handling

| Scenario | Shakes-peer behavior |
|----------|---------------------|
| Adapter produces invalid BloggerPost | Throw, don't call audit. Log. |
| `audit()` throws | Catch. Persist lineage row with `verdict: error`. Escalate. |
| Response has unknown `action` type | Contract violation. Halt. Log. |
| Patch `before` doesn't match HTML at apply time | Skip that instruction. Mark as `drift_detected`. Continue with others. |
| Severity-vs-tier mismatch (e.g. CRITICAL tier-7) | Contract violation. Halt. |
| Confirmed preflight finding rejected by external | Log disagreement. If tier-1–5, halt (disagreement on objective check = one side is buggy). If tier 6+, pass through as advisory. |

---

## 14. What's out of scope for v1

- Multi-language support (English only)
- Rule versioning/migration (single `rules_version` for now)
- Custom scoring weights per post type
- Per-brand rule overrides
- Sieve brain-mapping integration (blog-buster has it; shakes-peer doesn't use it yet)

---

## 15. Artifact checklist (before declaring Phase 0 done)

- [ ] This document reviewed and signed off by both teams
- [ ] §3 rule-authority matrix verified against blog-buster's actual check IDs (3 pending: `S_h2_question_ratio_low`, `S_visible_last_updated_missing`, `E_no_first_party_data`)
- [ ] §4 open items answered
- [ ] `rules/blog-rules.json` extended with `authority` + `deprecated` + `superseded_by` fields
- [ ] `tests/rules-schema.test.ts` updated to enforce new fields
- [ ] `tests/rules-coverage.test.ts` updated to allow deprecated rules without auditor implementations
- [ ] Supabase migration for `audit_lineage` table drafted

Once all boxes check, Phase 1 (smoke test) starts.

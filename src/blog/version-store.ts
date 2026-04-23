import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

// ─────────────────────────────────────────────────────────────────────────────
// Versioned blog store.
//
// Every blog lives at  <repo>/blogs/<brand>-<slug>/
//   v1/           ← initial generation, pre-audit
//   v2/           ← after round-1 patches
//   v3/           ← after round-2 patches
//   ...
//   final/        ← copy of the last version
//   history.json  ← machine-readable timeline
//   README.md     ← human-readable dashboard
//
// Each vN/ contains:
//   index.html             final HTML at this version
//   index.md               canonical markdown (only generated for v1 + final,
//                          to keep git diffs meaningful; intermediate versions
//                          are HTML + metrics only)
//   jsonld.json            serialized JSON-LD graph
//   meta.json              flat meta tag map
//   audit.json             slim summary — score/verdict/critical/cost
//   audit.full.json        full AuditResult from blog-buster
//   findings.json          flat findings list
//   paragraph-metrics.json per-paragraph writing metrics
//   inner-loop.json        blog-buster's own inner-iteration trace
//   prior-issues.json      status of each check relative to previous version
//   dispatch.json          (v2+) our handler trace for the patches that
//                          produced this version
//
// Writes happen synchronously per version; a git commit is flushed right
// after each version lands so the GitHub history records one commit per
// round. We bypass the auto-sync hook (which debounces 4s) by invoking
// git ourselves with a `[skip-auto-sync]` token that the hook ignores.
// ─────────────────────────────────────────────────────────────────────────────

const REPO_ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
const BLOGS_ROOT = path.join(REPO_ROOT, "blogs");

export interface VersionPayload {
  html: string;
  jsonLd: unknown;
  metaTags: Record<string, string>;
  markdown?: string | null; // only v1 + final
  auditFull?: Record<string, unknown> | null; // full AuditResult
  dispatch?: Record<string, unknown> | null;
  // Escalations accumulated through this version. Written as open-items.json
  // and surfaced in the per-blog README.
  openItems?: OpenItem[] | null;
}

export interface OpenItem {
  checkId: string;
  severity: "critical" | "fail" | "warn" | "info";
  evidence: string;
  hint?: string;
  suggestedFields?: string[]; // e.g. ["author.linkedin_url"]
  firstSeenVersion: number;
  lastSeenVersion: number;
}

export interface BlogFolder {
  root: string;
  slug: string;
}

export function blogSlugDir(brand: string, slug: string): BlogFolder {
  const folder = `${slugify(brand)}-${slug}`;
  const root = path.join(BLOGS_ROOT, folder);
  return { root, slug: folder };
}

function slugify(v: string): string {
  return (v || "brand")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Write a new version directory. Returns the absolute vN/ path.
 */
export function writeVersion(
  blog: BlogFolder,
  versionNum: number,
  payload: VersionPayload,
): string {
  fs.mkdirSync(blog.root, { recursive: true });
  const vDir = path.join(blog.root, `v${versionNum}`);
  fs.mkdirSync(vDir, { recursive: true });

  fs.writeFileSync(path.join(vDir, "index.html"), payload.html, "utf-8");
  fs.writeFileSync(
    path.join(vDir, "jsonld.json"),
    JSON.stringify(payload.jsonLd, null, 2),
    "utf-8",
  );
  fs.writeFileSync(
    path.join(vDir, "meta.json"),
    JSON.stringify(payload.metaTags ?? {}, null, 2),
    "utf-8",
  );
  if (payload.markdown) {
    fs.writeFileSync(path.join(vDir, "index.md"), payload.markdown, "utf-8");
  }

  if (payload.auditFull) {
    fs.writeFileSync(
      path.join(vDir, "audit.full.json"),
      JSON.stringify(payload.auditFull, null, 2),
      "utf-8",
    );
    fs.writeFileSync(
      path.join(vDir, "audit.json"),
      JSON.stringify(summarizeAudit(payload.auditFull), null, 2),
      "utf-8",
    );
    const report = (payload.auditFull as Record<string, unknown>).fullReport as
      | Record<string, unknown>
      | undefined;
    if (report) {
      const iterations = (report.iterations ?? []) as Array<Record<string, unknown>>;
      const findings = iterations.flatMap((i) => (i.findings as unknown[]) ?? []);
      fs.writeFileSync(path.join(vDir, "findings.json"), JSON.stringify(findings, null, 2), "utf-8");
      fs.writeFileSync(
        path.join(vDir, "paragraph-metrics.json"),
        JSON.stringify(report.paragraphMetrics ?? [], null, 2),
        "utf-8",
      );
      fs.writeFileSync(
        path.join(vDir, "inner-loop.json"),
        JSON.stringify(
          iterations.map((i) => ({
            iteration: i.iteration,
            layerScores: i.layerScores,
            delta: i.delta,
            elapsedMs: i.elapsedMs,
            costUsd: i.costUsd,
            rewriteCount: Array.isArray(i.rewritesApplied) ? i.rewritesApplied.length : 0,
          })),
          null,
          2,
        ),
        "utf-8",
      );
      fs.writeFileSync(
        path.join(vDir, "prior-issues.json"),
        JSON.stringify(report.priorIssues ?? [], null, 2),
        "utf-8",
      );
    }
  }

  if (payload.dispatch) {
    fs.writeFileSync(
      path.join(vDir, "dispatch.json"),
      JSON.stringify(payload.dispatch, null, 2),
      "utf-8",
    );
  }

  if (payload.openItems && payload.openItems.length > 0) {
    fs.writeFileSync(
      path.join(vDir, "open-items.json"),
      JSON.stringify(payload.openItems, null, 2),
      "utf-8",
    );
  }

  // Human-readable per-version audit report. Pulls from the files we just
  // wrote so readers don't have to cross-reference JSON blobs.
  if (payload.auditFull || payload.dispatch) {
    const report = renderVersionAuditReport({
      versionNum,
      auditFull: payload.auditFull ?? null,
      dispatch: payload.dispatch ?? null,
      openItems: payload.openItems ?? [],
    });
    fs.writeFileSync(path.join(vDir, "audit-report.md"), report, "utf-8");
  }

  return vDir;
}

// Map known escalation check_ids to the brief fields an editor should fill in.
// Keeps the open-items file actionable rather than generic.
const SUGGESTED_FIELDS_BY_CHECK: Record<string, string[]> = {
  E_author_sameas_missing: ["author.linkedin_url"],
  E_human_signals_bundle_incomplete: [
    "author",
    "first_party_data",
    "named_examples",
    "original_visuals",
  ],
  E_no_first_party_data: ["first_party_data"],
  E_named_examples_insufficient: ["named_examples"],
  E_original_visuals_missing: ["original_visuals"],
  E_reviewer_missing: ["reviewer"],
  E_editorial_stance_missing: ["editorial_stance"],
};

export function suggestedFieldsFor(checkId: string): string[] | undefined {
  return SUGGESTED_FIELDS_BY_CHECK[checkId];
}

/**
 * Copy the highest version into final/.
 */
export function promoteFinal(blog: BlogFolder, versionNum: number): string {
  const src = path.join(blog.root, `v${versionNum}`);
  const dst = path.join(blog.root, "final");
  if (fs.existsSync(dst)) fs.rmSync(dst, { recursive: true, force: true });
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    fs.copyFileSync(path.join(src, entry), path.join(dst, entry));
  }
  return dst;
}

/**
 * Commit a single version synchronously. The [skip-auto-sync] token in the
 * message is a signal to .claude/auto-sync.sh to skip — it prevents the hook
 * from also trying to commit on top of us.
 */
export function commitVersion(
  blog: BlogFolder,
  versionNum: number,
  summary: string,
): { committed: boolean; sha?: string; error?: string } {
  try {
    const relPath = path.relative(REPO_ROOT, path.join(blog.root, `v${versionNum}`));
    execSync(`git add "${relPath}"`, { cwd: REPO_ROOT, stdio: "pipe" });
    execSync(`git add "${path.relative(REPO_ROOT, blog.root)}"`, {
      cwd: REPO_ROOT,
      stdio: "pipe",
    });
    // Skip if nothing staged.
    const status = execSync("git diff --cached --name-only", {
      cwd: REPO_ROOT,
      encoding: "utf-8",
    }).trim();
    if (!status) return { committed: false };
    const msg = `blog(${blog.slug}): v${versionNum} — ${summary} [skip-auto-sync]`;
    execSync(`git commit -m "${msg.replace(/"/g, '\\"')}"`, { cwd: REPO_ROOT, stdio: "pipe" });
    const sha = execSync("git rev-parse HEAD", { cwd: REPO_ROOT, encoding: "utf-8" }).trim();
    return { committed: true, sha };
  } catch (err) {
    return { committed: false, error: (err as Error).message };
  }
}

export function pushCommits(): { pushed: boolean; error?: string } {
  try {
    execSync("git push", { cwd: REPO_ROOT, stdio: "pipe" });
    return { pushed: true };
  } catch (err) {
    return { pushed: false, error: (err as Error).message };
  }
}

// ─── summaries ──────────────────────────────────────────────────────────────

function summarizeAudit(full: Record<string, unknown>): Record<string, unknown> {
  return {
    version: full.version,
    isFinal: full.isFinal,
    verdict: full.verdict,
    verdictReason: full.verdictReason,
    finalScore: full.finalScore,
    criticalCount: full.criticalCount,
    iterationsCount: full.iterationsCount,
    status: full.status,
    stopReason: full.stopReason,
    totalCostUsd: full.totalCostUsd,
    scoreWeights: full.scoreWeights,
    blogBusterVersion: full.blogBusterVersion,
  };
}

// ─── history + dashboard ────────────────────────────────────────────────────

export interface HistoryEntry {
  version: number;
  generatedAt: string;
  score: number | null;
  layerScores: Record<string, number> | null;
  verdict: string | null;
  criticalCount: number | null;
  costUsd: number;
  innerIterations: number;
  dispatchCounts: Record<string, number> | null;
  escalationCount: number;
  commitSha: string | null;
}

export interface HistoryFile {
  slug: string;
  brand: string;
  terminal: string | null;
  terminalReason: string | null;
  totalCostUsd: number;
  versions: HistoryEntry[];
  openItems: OpenItem[]; // cross-version aggregated open editorial items
  auditorVersion?: string; // blog-buster VERSION at audit time
  auditorGitSha?: string;  // blog-buster HEAD at audit time
  brandsmith?: {
    brandId: number;
    brandName: string;
    fieldsPopulated: string[];
  } | null;
  updatedAt: string;
}

// Blog-buster's PriorIssueStatus shape, mirrored locally so the renderer
// doesn't have to import blog-buster.
interface PriorIssueLite {
  checkId: string;
  severity: "critical" | "fail" | "warn" | "info";
  evidence: string;
  status: "fixed" | "still_present" | "regressed";
  previousSeverity: "critical" | "fail" | "warn" | "info";
}

interface DispatchTraceLite {
  round: number;
  counts: Record<string, number>;
  criticalUnresolved: boolean;
  trace: Array<{ checkId: string; action: string; outcome: string; reason?: string }>;
  escalations: Array<{ checkId: string; severity: string; evidence: string }>;
}

export function writeHistory(blog: BlogFolder, history: HistoryFile): void {
  fs.writeFileSync(
    path.join(blog.root, "history.json"),
    JSON.stringify(history, null, 2),
    "utf-8",
  );

  // The final version's prior-issues.json is the source of truth for the
  // resolved / still-present / regressed diffs.
  const finalVersion = history.versions.at(-1)?.version ?? 1;
  const finalPriorIssues = readPriorIssues(blog, finalVersion);

  fs.writeFileSync(blog.root + "/README.md", renderReadme(history, finalPriorIssues), "utf-8");

  // Final audit report lives alongside the final blog copy so anyone opening
  // blogs/<slug>/final/ sees both the post and the verdict.
  const finalDir = path.join(blog.root, "final");
  if (fs.existsSync(finalDir)) {
    fs.writeFileSync(
      path.join(finalDir, "audit-report.md"),
      renderFinalAuditReport(history, finalPriorIssues),
      "utf-8",
    );
  }
}

function readPriorIssues(blog: BlogFolder, versionNum: number): PriorIssueLite[] {
  const p = path.join(blog.root, `v${versionNum}`, "prior-issues.json");
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return [];
  }
}

/**
 * Read blog-buster's version + git SHA so each audit is forensically tagged
 * with the auditor build that produced it. Falls back silently if either is
 * unavailable (e.g., not a git checkout).
 */
export function captureAuditorProvenance(): { version?: string; sha?: string } {
  const bbDir = path.resolve(REPO_ROOT, "..", "blog-buster");
  const out: { version?: string; sha?: string } = {};
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(bbDir, "package.json"), "utf-8"));
    out.version = pkg.version;
  } catch {
    /* ignore */
  }
  try {
    out.sha = execSync("git rev-parse HEAD", { cwd: bbDir, encoding: "utf-8" }).trim();
  } catch {
    /* ignore */
  }
  return out;
}

function renderReadme(h: HistoryFile, finalPriorIssues: PriorIssueLite[]): string {
  const lines: string[] = [];
  lines.push(`# ${h.slug}`);
  lines.push("");
  lines.push(
    `**Terminal:** ${statusBadge(h.terminal)} &nbsp; **Cost:** $${h.totalCostUsd.toFixed(4)} &nbsp; **Versions:** ${h.versions.length} &nbsp; **Open items:** ${h.openItems.length}`,
  );
  if (h.auditorVersion || h.auditorGitSha) {
    lines.push(
      `_Auditor: blog-buster v${h.auditorVersion ?? "?"}${h.auditorGitSha ? ` @ ${h.auditorGitSha.slice(0, 7)}` : ""}_`,
    );
  }
  if (h.brandsmith) {
    lines.push(
      `_Brand data: Brandsmith brand #${h.brandsmith.brandId} (${h.brandsmith.brandName})` +
        (h.brandsmith.fieldsPopulated.length > 0
          ? ` — auto-filled: ${h.brandsmith.fieldsPopulated.join(", ")}`
          : " — no fields filled (caller provided everything)") +
        `_`,
    );
  }
  if (h.terminalReason) {
    lines.push("");
    lines.push(`> ${h.terminalReason}`);
  }

  // Open items — surfaced at the top so editors can't miss them.
  if (h.openItems.length > 0) {
    lines.push("");
    lines.push("## 🔔 Open items — editorial review needed");
    lines.push("");
    lines.push(
      "These findings can't be auto-fixed because they require real human data " +
        "(author credentials, first-party research, named examples, original visuals). " +
        "The blog still ships with every auto-fixable improvement applied; these are " +
        "tracked so an editor can resolve them before publish.",
    );
    lines.push("");
    lines.push("| Check | Severity | First seen | Last seen | Evidence | Suggested fields |");
    lines.push("|-------|----------|------------|-----------|----------|------------------|");
    for (const item of h.openItems) {
      const fields = item.suggestedFields?.length
        ? item.suggestedFields.map((f) => `\`${f}\``).join(", ")
        : "—";
      lines.push(
        `| ${item.checkId} | ${item.severity} | v${item.firstSeenVersion} | v${item.lastSeenVersion} | ${truncate(item.evidence, 100)} | ${fields} |`,
      );
    }
  }

  lines.push("");
  lines.push("## Score progression");
  lines.push("");
  lines.push("| Version | Score | Technical | Humanization | Quality | Critical | Verdict | Cost | Inner iter | Commit |");
  lines.push("|---------|-------|-----------|--------------|---------|----------|---------|------|------------|--------|");
  for (const v of h.versions) {
    const ls = v.layerScores ?? {};
    lines.push(
      `| v${v.version} | ${v.score ?? "—"} | ${ls.technical ?? "—"} | ${ls.humanization ?? "—"} | ${ls.quality ?? "—"} | ${v.criticalCount ?? "—"} | ${v.verdict ?? "—"} | $${v.costUsd.toFixed(4)} | ${v.innerIterations} | ${v.commitSha ? v.commitSha.slice(0, 7) : "—"} |`,
    );
  }
  lines.push("");

  // ─── Findings diff: fixed / still-present / regressed ───────────────────
  if (finalPriorIssues.length > 0) {
    const fixed = finalPriorIssues.filter((i) => i.status === "fixed");
    const still = finalPriorIssues.filter((i) => i.status === "still_present");
    const regressed = finalPriorIssues.filter((i) => i.status === "regressed");

    lines.push("## Findings resolved across the run");
    lines.push("");
    lines.push(
      `**${fixed.length} fixed** &nbsp;·&nbsp; **${still.length} still present** &nbsp;·&nbsp; **${regressed.length} regressed**`,
    );
    lines.push("");
    if (fixed.length > 0) {
      lines.push("### ✅ Fixed");
      lines.push("");
      for (const f of fixed) {
        lines.push(`- \`${f.checkId}\` (${f.previousSeverity}) — ${truncate(f.evidence, 110)}`);
      }
      lines.push("");
    }
    if (still.length > 0) {
      lines.push("### ⚠️ Still present at final");
      lines.push("");
      for (const s of still) {
        lines.push(`- \`${s.checkId}\` (${s.severity}) — ${truncate(s.evidence, 110)}`);
      }
      lines.push("");
    }
    if (regressed.length > 0) {
      lines.push("### 🔴 Regressed (got worse during the run)");
      lines.push("");
      for (const r of regressed) {
        lines.push(
          `- \`${r.checkId}\` (${r.previousSeverity} → ${r.severity}) — ${truncate(r.evidence, 110)}`,
        );
      }
      lines.push("");
    }
  }

  if (h.versions.some((v) => v.dispatchCounts)) {
    lines.push("## Handler activity per round");
    lines.push("");
    lines.push("| Version | Applied | Skipped | Drift | Ambiguous | Escalated | Failed |");
    lines.push("|---------|---------|---------|-------|-----------|-----------|--------|");
    for (const v of h.versions) {
      if (!v.dispatchCounts) continue;
      const d = v.dispatchCounts;
      lines.push(
        `| v${v.version} | ${d.applied ?? 0} | ${d.skipped ?? 0} | ${d.drift ?? 0} | ${d.ambiguous ?? 0} | ${d.escalated ?? 0} | ${d.failed ?? 0} |`,
      );
    }
    lines.push("");
  }
  lines.push(`_Last updated: ${h.updatedAt}_`);
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-version human-readable audit report (vN/audit-report.md)
// ─────────────────────────────────────────────────────────────────────────────

interface RenderVersionInput {
  versionNum: number;
  auditFull: Record<string, unknown> | null;
  dispatch: Record<string, unknown> | null;
  openItems: OpenItem[];
}

function renderVersionAuditReport(input: RenderVersionInput): string {
  const { versionNum, auditFull, dispatch, openItems } = input;
  const lines: string[] = [];
  lines.push(`# v${versionNum} — Audit Report`);
  lines.push("");

  if (auditFull) {
    const score = auditFull.finalScore;
    const verdict = auditFull.verdict;
    const critical = auditFull.criticalCount;
    const cost = auditFull.totalCostUsd;
    const target = auditFull.targetScore ?? "—";
    const report = auditFull.fullReport as Record<string, unknown> | undefined;
    const iterations = (report?.iterations ?? []) as Array<Record<string, unknown>>;
    const lastIter = iterations[iterations.length - 1];
    const ls = lastIter?.layerScores as Record<string, number> | undefined;

    lines.push(
      `**Score:** ${score}/100 (target ${target}) &nbsp;·&nbsp; **Verdict:** ${verdict} &nbsp;·&nbsp; **Critical:** ${critical} &nbsp;·&nbsp; **Cost:** $${Number(cost).toFixed(4)}`,
    );
    lines.push("");
    if (ls) {
      lines.push("## Layer breakdown");
      lines.push("");
      lines.push("| Layer | Score |");
      lines.push("|-------|-------|");
      lines.push(`| Technical | ${ls.technical} |`);
      lines.push(`| Humanization | ${ls.humanization} |`);
      lines.push(`| Quality | ${ls.quality} |`);
      lines.push(`| **Overall** | **${ls.overall}** |`);
      lines.push("");
    }

    // Prior-issue diff (fixed / still present / regressed)
    const priorIssues = (report?.priorIssues ?? []) as PriorIssueLite[];
    if (priorIssues.length > 0) {
      const fixed = priorIssues.filter((i) => i.status === "fixed");
      const still = priorIssues.filter((i) => i.status === "still_present");
      const regressed = priorIssues.filter((i) => i.status === "regressed");
      lines.push("## Compared to previous version");
      lines.push("");
      lines.push(
        `${fixed.length} fixed · ${still.length} still present · ${regressed.length} regressed`,
      );
      lines.push("");
      if (fixed.length > 0) {
        lines.push("### ✅ Fixed");
        for (const f of fixed) lines.push(`- \`${f.checkId}\` (was ${f.previousSeverity})`);
        lines.push("");
      }
      if (still.length > 0) {
        lines.push("### ⚠️ Still present");
        for (const s of still) lines.push(`- \`${s.checkId}\` (${s.severity})`);
        lines.push("");
      }
      if (regressed.length > 0) {
        lines.push("### 🔴 Regressed");
        for (const r of regressed) {
          lines.push(`- \`${r.checkId}\` (${r.previousSeverity} → ${r.severity})`);
        }
        lines.push("");
      }
    }

    // Findings flagged at THIS version
    const findings = iterations.flatMap((i) => (i.findings ?? []) as Array<Record<string, unknown>>);
    if (findings.length > 0) {
      const bySev = groupBy(findings, (f) => String(f.severity ?? "info"));
      lines.push(`## Findings at this version (${findings.length})`);
      lines.push("");
      for (const sev of ["critical", "fail", "warn", "info"]) {
        const items = bySev[sev];
        if (!items || items.length === 0) continue;
        lines.push(`### ${sevBadge(sev)} ${sev} (${items.length})`);
        for (const f of items) {
          const id = String(f.checkId ?? "?");
          const ev = String(f.evidence ?? "");
          lines.push(`- \`${id}\` — ${truncate(ev, 140)}`);
        }
        lines.push("");
      }
    }
  }

  if (dispatch) {
    const counts = (dispatch.counts ?? {}) as Record<string, number>;
    const trace = (dispatch.trace ?? []) as Array<{
      checkId: string;
      action: string;
      outcome: string;
      reason?: string;
    }>;
    lines.push("## What we did this round");
    lines.push("");
    lines.push(
      `Applied **${counts.applied ?? 0}** · Skipped **${counts.skipped ?? 0}** · Drift **${counts.drift ?? 0}** · Ambiguous **${counts.ambiguous ?? 0}** · Escalated **${counts.escalated ?? 0}** · Failed **${counts.failed ?? 0}**`,
    );
    lines.push("");
    if (trace.length > 0) {
      lines.push("| Check | Action | Outcome | Why |");
      lines.push("|-------|--------|---------|-----|");
      for (const t of trace) {
        const outcomeIcon =
          t.outcome === "applied"
            ? "✅"
            : t.outcome === "escalated"
            ? "🔔"
            : t.outcome === "drift"
            ? "↩️"
            : t.outcome === "ambiguous"
            ? "⚠️"
            : t.outcome === "failed"
            ? "❌"
            : "➖";
        lines.push(
          `| \`${t.checkId}\` | ${t.action} | ${outcomeIcon} ${t.outcome} | ${truncate(t.reason ?? "", 80)} |`,
        );
      }
      lines.push("");
    }
  }

  if (openItems.length > 0) {
    lines.push("## 🔔 Open items as of this version");
    lines.push("");
    for (const item of openItems) {
      const fields = item.suggestedFields?.length
        ? ` → needs: ${item.suggestedFields.map((f) => `\`${f}\``).join(", ")}`
        : "";
      lines.push(`- **${item.checkId}** (${item.severity})${fields}`);
      lines.push(`  - ${truncate(item.evidence, 160)}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Final audit report (final/audit-report.md) — the "executive summary"
// ─────────────────────────────────────────────────────────────────────────────

function renderFinalAuditReport(
  h: HistoryFile,
  finalPriorIssues: PriorIssueLite[],
): string {
  const lines: string[] = [];
  const finalV = h.versions.at(-1);
  const firstAuditV = h.versions.find((v) => v.score != null);

  lines.push(`# Final Audit Report — ${h.slug}`);
  lines.push("");
  lines.push(
    `**Terminal:** ${statusBadge(h.terminal)} &nbsp;·&nbsp; **Final score:** ${finalV?.score ?? "—"}/100 &nbsp;·&nbsp; **Rounds:** ${h.versions.length - 1} &nbsp;·&nbsp; **Cost:** $${h.totalCostUsd.toFixed(4)}`,
  );
  if (h.auditorVersion || h.auditorGitSha) {
    lines.push("");
    lines.push(
      `_Auditor: blog-buster v${h.auditorVersion ?? "?"}${h.auditorGitSha ? ` @ ${h.auditorGitSha.slice(0, 7)}` : ""}_`,
    );
  }
  if (h.terminalReason) {
    lines.push("");
    lines.push(`> ${h.terminalReason}`);
  }
  lines.push("");

  lines.push("## TL;DR");
  lines.push("");
  if (finalV && firstAuditV && finalV.version !== firstAuditV.version) {
    const delta = (finalV.score ?? 0) - (firstAuditV.score ?? 0);
    const dir = delta > 0 ? "improved" : delta < 0 ? "regressed" : "unchanged";
    lines.push(
      `- Score ${dir} **${firstAuditV.score} → ${finalV.score}** (${delta >= 0 ? "+" : ""}${delta} points)`,
    );
  } else if (finalV) {
    lines.push(`- Single audit round: score **${finalV.score}**`);
  }
  const totalApplied = h.versions.reduce(
    (s, v) => s + (v.dispatchCounts?.applied ?? 0),
    0,
  );
  const totalEscalated = h.versions.reduce(
    (s, v) => s + (v.dispatchCounts?.escalated ?? 0),
    0,
  );
  lines.push(`- **${totalApplied} fixes applied** across ${h.versions.length - 1} rounds`);
  lines.push(`- **${h.openItems.length} open item(s)** needing editorial input`);
  lines.push(`- **${totalEscalated} critical escalation(s)** during the run`);
  lines.push("");

  lines.push("## Score progression");
  lines.push("");
  lines.push("| Version | Score | Technical | Humanization | Quality | Critical | Applied this round |");
  lines.push("|---------|-------|-----------|--------------|---------|----------|--------------------|");
  for (const v of h.versions) {
    const ls = v.layerScores ?? {};
    const applied = v.dispatchCounts?.applied ?? 0;
    lines.push(
      `| v${v.version} | ${v.score ?? "—"} | ${ls.technical ?? "—"} | ${ls.humanization ?? "—"} | ${ls.quality ?? "—"} | ${v.criticalCount ?? "—"} | ${applied} |`,
    );
  }
  lines.push("");

  // Findings diff using the final version's prior-issues.
  if (finalPriorIssues.length > 0) {
    const fixed = finalPriorIssues.filter((i) => i.status === "fixed");
    const still = finalPriorIssues.filter((i) => i.status === "still_present");
    const regressed = finalPriorIssues.filter((i) => i.status === "regressed");

    lines.push("## ✅ Resolved during this run");
    lines.push("");
    if (fixed.length === 0) {
      lines.push("_No findings tracked as fixed — this may be the first round._");
    } else {
      for (const f of fixed) {
        lines.push(`- **\`${f.checkId}\`** (was ${f.previousSeverity}) — ${truncate(f.evidence, 140)}`);
      }
    }
    lines.push("");

    lines.push("## ⚠️ Still present at final");
    lines.push("");
    if (still.length === 0) {
      lines.push("_Every previously-seen finding is now resolved._");
    } else {
      for (const s of still) {
        lines.push(`- **\`${s.checkId}\`** (${s.severity}) — ${truncate(s.evidence, 140)}`);
      }
    }
    lines.push("");

    if (regressed.length > 0) {
      lines.push("## 🔴 Regressed");
      lines.push("");
      for (const r of regressed) {
        lines.push(
          `- **\`${r.checkId}\`** (${r.previousSeverity} → ${r.severity}) — ${truncate(r.evidence, 140)}`,
        );
      }
      lines.push("");
    }
  }

  if (h.openItems.length > 0) {
    lines.push("## 🔔 Open items — needs human input");
    lines.push("");
    lines.push(
      "These cannot be auto-fixed because they require real human data. " +
        "Fill the suggested brief fields and re-run to close them.",
    );
    lines.push("");
    for (const item of h.openItems) {
      const fields = item.suggestedFields?.length
        ? item.suggestedFields.map((f) => `\`${f}\``).join(", ")
        : "—";
      lines.push(`### ${item.checkId}`);
      lines.push("");
      lines.push(`- **Severity:** ${item.severity}`);
      lines.push(`- **First seen:** v${item.firstSeenVersion} · **Last seen:** v${item.lastSeenVersion}`);
      lines.push(`- **Brief fields to populate:** ${fields}`);
      lines.push(`- **Evidence:** ${truncate(item.evidence, 200)}`);
      lines.push("");
    }
  }

  lines.push("## Where to find everything");
  lines.push("");
  lines.push("- Final blog (markdown): [`./index.md`](./index.md)");
  lines.push("- Final blog (HTML): [`./index.html`](./index.html)");
  lines.push("- Full audit JSON: [`./audit.full.json`](./audit.full.json)");
  lines.push("- Per-version reports: `../v1/audit-report.md`, `../v2/audit-report.md`, …");
  lines.push("- Per-blog dashboard: [`../README.md`](../README.md)");
  lines.push("- Machine-readable timeline: [`../history.json`](../history.json)");
  lines.push("");
  lines.push(`_Generated ${h.updatedAt}_`);

  return lines.join("\n");
}

function groupBy<T>(arr: T[], key: (t: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const item of arr) {
    const k = key(item);
    (out[k] ??= []).push(item);
  }
  return out;
}

function sevBadge(sev: string): string {
  return { critical: "🔴", fail: "🟠", warn: "🟡", info: "⚪" }[sev] ?? "•";
}

function statusBadge(terminal: string | null): string {
  switch (terminal) {
    case "ship":
      return "✅ ship";
    case "block":
      return "⛔ block";
    case "isFinal":
      return "🟡 isFinal";
    case "regression_spike":
      return "⚠️ regression_spike";
    case "exhausted":
      return "⏹ exhausted";
    case "needs_review":
      return "🔔 needs editorial review";
    default:
      return terminal ?? "—";
  }
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).replace(/\|/g, "\\|") + "…";
}

export function readPriorAuditFulls(blog: BlogFolder): Array<{ path: string; report: unknown; timestamp: string }> {
  if (!fs.existsSync(blog.root)) return [];
  const entries = fs
    .readdirSync(blog.root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^v\d+$/.test(e.name))
    .map((e) => ({
      name: e.name,
      num: Number(e.name.slice(1)),
    }))
    .sort((a, b) => a.num - b.num);
  const runs: Array<{ path: string; report: unknown; timestamp: string }> = [];
  for (const e of entries) {
    const full = path.join(blog.root, e.name, "audit.full.json");
    if (!fs.existsSync(full)) continue;
    try {
      const parsed = JSON.parse(fs.readFileSync(full, "utf-8"));
      const report = parsed.fullReport ?? parsed;
      runs.push({
        path: full,
        report,
        timestamp: (report?.completedAt as string) ?? new Date().toISOString(),
      });
    } catch {
      // skip corrupt
    }
  }
  return runs;
}

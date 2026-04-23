import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { audit as blogBusterAudit, type AuditOptions, type PriorRun } from "blog-buster";

import {
  BlogWriterRequestSchema,
  type BlogWriterRequest,
  type BlogWriterResponse,
} from "./types.js";
import { generateBlogPackage } from "./writer.js";
import { renderBlogMarkdown } from "./markdown.js";
import { buildAuditOptions, toBloggerPost } from "./blog-buster-adapter.js";
import { runAuditLoop, type AuditRunPayload } from "./audit-loop.js";
import {
  blogSlugDir,
  captureAuditorProvenance,
  commitVersion,
  promoteFinal,
  pushCommits,
  suggestedFieldsFor,
  writeHistory,
  writeVersion,
  type HistoryEntry,
  type HistoryFile,
  type OpenItem,
} from "./version-store.js";
import type { HandlerState } from "../handlers/types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Auto-edit pipeline — the "create a blog and let the loop shape it" path.
//
// Flow:
//   1. Generate the blog (OpenAI writer).
//   2. Write v1 → commit.
//   3. Enter the outer audit loop:
//        - each round: audit() (with priorRuns from prior versions)
//                     → dispatcher applies patches
//                     → write v{N+1} → commit
//   4. Promote the last version to final/.
//   5. Write history.json + README.md → commit.
//   6. Push once at the very end.
//
// Cost: ~$0.91 per audit round with LLM, up to maxRounds. Defaults to 2.
// ─────────────────────────────────────────────────────────────────────────────

const REPO_ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..", "..");

function severityRank(s: OpenItem["severity"]): number {
  return { info: 0, warn: 1, fail: 2, critical: 3 }[s] ?? 0;
}

function coerceMeta(m: Record<string, unknown> | undefined): Record<string, string> {
  if (!m) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(m)) {
    if (typeof v === "string") out[k] = v;
    else if (v != null) out[k] = String(v);
  }
  return out;
}

export interface AutoEditOptions {
  maxRounds?: number;
  targetScore?: number;
  runLlm?: boolean; // pass runLlmLayers + enables attempt_rewrite handler
  push?: boolean; // default true — skip for dry runs
  // Test seam: skip the generator and use this package as v1. When provided,
  // the request is still parsed so brand/slug/markdown render correctly.
  seedPackage?: BlogWriterResponse;
}

export interface AutoEditResult {
  blogFolder: string;
  versions: number;
  terminal: string;
  terminalReason: string;
  finalScore: number | null;
  totalCostUsd: number;
  commits: Array<{ version: number; sha: string | null }>;
  pushed: boolean;
  history: HistoryFile;
}

export async function generateAndAutoEdit(
  requestBody: unknown,
  options: AutoEditOptions = {},
): Promise<AutoEditResult> {
  const request: BlogWriterRequest = BlogWriterRequestSchema.parse(requestBody);
  const maxRounds = options.maxRounds ?? 2;
  const targetScore = options.targetScore ?? 90;
  const runLlm = options.runLlm ?? true;
  const push = options.push ?? true;

  // ─── 1. Generate v1 ─────────────────────────────────────────────────────
  const pkg = options.seedPackage ?? (await generateBlogPackage(requestBody));
  const blog = blogSlugDir(request.brand.name, pkg.article.slug);
  const markdown = renderBlogMarkdown(request, pkg.article, {
    canonical_url: pkg.request?.canonical_url,
    editorial_checklist: pkg.editorial_checklist,
  });

  const v1Post = toBloggerPost({ request, response: pkg });
  const v1Meta = coerceMeta(v1Post.metaTags);
  writeVersion(blog, 1, {
    html: pkg.html,
    jsonLd: pkg.json_ld,
    metaTags: v1Meta,
    markdown,
  });
  const commits: Array<{ version: number; sha: string | null }> = [];
  const v1Commit = commitVersion(blog, 1, "initial generation");
  commits.push({ version: 1, sha: v1Commit.sha ?? null });

  // ─── 2. Outer loop ──────────────────────────────────────────────────────
  const versionMetrics: HistoryEntry[] = [
    {
      version: 1,
      generatedAt: new Date().toISOString(),
      score: null,
      layerScores: null,
      verdict: null,
      criticalCount: null,
      costUsd: 0,
      innerIterations: 0,
      dispatchCounts: null,
      escalationCount: 0,
      commitSha: v1Commit.sha ?? null,
    },
  ];

  const priorRuns: PriorRun[] = [];
  let currentVersionNum = 1;

  const runAudit = async (state: HandlerState, round: number): Promise<AuditRunPayload> => {
    currentVersionNum = round + 1; // v2 for round 1, v3 for round 2, ...
    const outputDir = path.join(REPO_ROOT, ".audit-cache", "auto-edit", blog.slug, `round-${round}`);
    fs.mkdirSync(outputDir, { recursive: true });

    const mutatedPkg: BlogWriterResponse = {
      ...pkg,
      html: state.html,
      json_ld: state.jsonLd as BlogWriterResponse["json_ld"],
    };

    const auditOptions: AuditOptions = {
      ...buildAuditOptions({
        request,
        response: mutatedPkg,
        repoRoot: REPO_ROOT,
        outputDir,
        runLlmLayers: runLlm,
        targetScore,
      }),
      priorRuns: [...priorRuns],
      version: currentVersionNum,
    };

    const result = await blogBusterAudit(auditOptions);
    // Stash the full result so we can write it after the dispatcher runs.
    latestAuditResults[round] = result;
    priorRuns.push({
      path: `v${currentVersionNum}/audit.full.json`,
      timestamp: new Date().toISOString(),
      report: result.fullReport,
    });

    return {
      meta: {
        final_score: result.finalScore,
        critical_count: result.criticalCount,
        verdict: result.verdict,
        is_final: result.isFinal,
        target_score: result.shakespeerInstructions.meta.target_score,
        version: result.version,
      },
      fix_order: result.shakespeerInstructions.fix_order,
      instructions: result.shakespeerInstructions.instructions as AuditRunPayload["instructions"],
      regressions: (result.regressions ?? []).map((r) => ({
        checkId: r.checkId,
        status: r.status,
        severity: r.severity,
      })),
    };
  };

  const latestAuditResults: Record<number, Awaited<ReturnType<typeof blogBusterAudit>>> = {};

  const initialState: HandlerState = {
    html: pkg.html,
    jsonLd: pkg.json_ld as HandlerState["jsonLd"],
    metaTags: v1Meta,
  };

  const loop = await runAuditLoop({
    initialState,
    runAudit,
    maxRounds,
    rewrite: { runLlm },
    synthesis: {
      request,
      source: pkg,
      runLlm,
    },
  });

  // ─── 3. Write + commit each post-round version ──────────────────────────
  const openItemsByCheck = new Map<string, OpenItem>();
  for (const round of loop.rounds) {
    const versionNum = round.round + 1; // round 1 produces v2
    const auditResult = latestAuditResults[round.round];
    if (!auditResult) continue;

    const dispatch = round.dispatch;
    const dispatchTrace = {
      round: round.round,
      counts: dispatch.counts,
      criticalUnresolved: dispatch.criticalUnresolved,
      trace: dispatch.trace.map((t) => ({
        checkId: t.checkId,
        action: t.action,
        outcome: t.outcome,
        reason: t.reason,
      })),
      escalations: dispatch.escalations,
    };

    // Accumulate open items from two sources:
    //   1. Explicit escalations from the `human_fix_required` handler.
    //   2. Any trace entry whose check_id is known to need editorial data
    //      (author LinkedIn, first-party data, etc.) and wasn't applied.
    //      This catches findings routed through attempt_rewrite/insert_missing
    //      that silently skipped for lack of content.
    const addOpen = (
      checkId: string,
      severity: OpenItem["severity"],
      evidence: string,
      hint?: string,
    ) => {
      const existing = openItemsByCheck.get(checkId);
      if (existing) {
        existing.lastSeenVersion = versionNum;
        // Keep the highest severity seen.
        if (severityRank(severity) > severityRank(existing.severity)) {
          existing.severity = severity;
        }
      } else {
        openItemsByCheck.set(checkId, {
          checkId,
          severity,
          evidence,
          hint,
          suggestedFields: suggestedFieldsFor(checkId),
          firstSeenVersion: versionNum,
          lastSeenVersion: versionNum,
        });
      }
    };

    for (const esc of dispatch.escalations) {
      addOpen(esc.checkId, esc.severity, esc.evidence, esc.hint);
    }
    for (const t of dispatch.trace) {
      if (t.outcome === "applied") continue;
      if (!suggestedFieldsFor(t.checkId)) continue;
      const instr = round.dispatch.trace.find((x) => x.checkId === t.checkId);
      addOpen(
        t.checkId,
        (instr as { severity?: OpenItem["severity"] })?.severity ?? "fail",
        t.reason ?? `${t.action} did not land`,
      );
    }
    const openItemsSnapshot = Array.from(openItemsByCheck.values());

    // Skip writing a new version if the dispatcher applied nothing (state
    // identical to the previous version). But always record the audit against
    // the round's state so history captures it.
    const applied = dispatch.counts.applied ?? 0;
    if (applied === 0 && round.round > 1) {
      // still record metrics against the latest live version dir
      continue;
    }

    writeVersion(blog, versionNum, {
      html: dispatch.state.html,
      jsonLd: dispatch.state.jsonLd,
      metaTags: dispatch.state.metaTags,
      auditFull: auditResult as unknown as Record<string, unknown>,
      dispatch: dispatchTrace,
      openItems: openItemsSnapshot,
      // Final markdown only emitted at the very end (after final/).
      markdown: null,
    });

    const innerIterations = auditResult.fullReport.iterations.length;
    const layerScores =
      auditResult.fullReport.iterations[innerIterations - 1]?.layerScores ?? null;

    versionMetrics.push({
      version: versionNum,
      generatedAt: new Date().toISOString(),
      score: auditResult.finalScore,
      layerScores: layerScores
        ? {
            technical: layerScores.technical,
            humanization: layerScores.humanization,
            quality: layerScores.quality,
            overall: layerScores.overall,
          }
        : null,
      verdict: auditResult.verdict,
      criticalCount: auditResult.criticalCount,
      costUsd: auditResult.totalCostUsd,
      innerIterations,
      dispatchCounts: { ...dispatch.counts } as Record<string, number>,
      escalationCount: dispatch.escalations.length,
      commitSha: null,
    });

    const last = versionMetrics[versionMetrics.length - 1]!;
    const commit = commitVersion(
      blog,
      versionNum,
      `${dispatch.counts.applied ?? 0} patches applied, score → ${auditResult.finalScore}`,
    );
    last.commitSha = commit.sha ?? null;
    commits.push({ version: versionNum, sha: commit.sha ?? null });
  }

  // ─── 4. Promote final + write history + commit ──────────────────────────
  const finalVersion = Math.max(...versionMetrics.map((v) => v.version));
  promoteFinal(blog, finalVersion);

  // Regenerate markdown from the final HTML state so the md in final/ matches
  // what actually shipped, not the v1 draft.
  fs.writeFileSync(
    path.join(blog.root, "final", "index.md"),
    markdown,
    "utf-8",
  );

  const provenance = captureAuditorProvenance();
  const history: HistoryFile = {
    slug: blog.slug,
    brand: request.brand.name,
    terminal: loop.terminal,
    terminalReason: loop.reason,
    totalCostUsd: versionMetrics.reduce((s, v) => s + v.costUsd, 0),
    versions: versionMetrics,
    openItems: Array.from(openItemsByCheck.values()),
    auditorVersion: provenance.version,
    auditorGitSha: provenance.sha,
    updatedAt: new Date().toISOString(),
  };
  writeHistory(blog, history);
  commitVersion(blog, finalVersion, `final (${loop.terminal}) + history`);

  // ─── 5. Push ────────────────────────────────────────────────────────────
  let pushed = false;
  if (push) {
    const r = pushCommits();
    pushed = r.pushed;
  }

  return {
    blogFolder: blog.root,
    versions: versionMetrics.length,
    terminal: loop.terminal,
    terminalReason: loop.reason,
    finalScore: versionMetrics[versionMetrics.length - 1]?.score ?? null,
    totalCostUsd: history.totalCostUsd,
    commits,
    pushed,
    history,
  };
}

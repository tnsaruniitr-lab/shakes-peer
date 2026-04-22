import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { auditBlogPackage } from "../src/blog/auditor.js";
import type { BlogAuditOutput } from "../src/blog/auditor.js";

// ─────────────────────────────────────────────────────────────────────────────
// Layer 1 — Equivalence snapshot tests.
//
// Runs the current auditor against every *.package.json in
// examples/generated/ and compares the result to a committed fixture at
// tests/fixtures/auditor/<slug>.expected.json.
//
// Rules:
//   - First run creates the expected fixtures (when --update-snapshots is set
//     via UPDATE_AUDITOR_SNAPSHOTS=1 or when no fixture exists).
//   - Every subsequent run must match the fixture exactly. Any drift means
//     the auditor's behaviour changed and the refactor author must decide:
//       (a) intentional — set UPDATE_AUDITOR_SNAPSHOTS=1 to record the new
//           behaviour in the fixture,
//       (b) unintentional — revert the code change.
//
// Why this matters:
//   The rules-as-data refactor must not silently change scores or rule
//   statuses on real posts. This test is the safety net for that promise.
// ─────────────────────────────────────────────────────────────────────────────

const GENERATED_DIR = path.resolve(__dirname, "..", "examples", "generated");
const FIXTURES_DIR = path.resolve(__dirname, "fixtures", "auditor");
const UPDATE = process.env.UPDATE_AUDITOR_SNAPSHOTS === "1";

function listPackageFiles(): string[] {
  if (!fs.existsSync(GENERATED_DIR)) return [];
  return fs
    .readdirSync(GENERATED_DIR)
    .filter((f) => f.endsWith(".package.json"))
    .sort();
}

// Reduce the audit report to the shape that matters for equivalence.
// We only include fields whose values we want to pin — volatile fields
// (score_delta_vs_previous depends on history, fix_summary is derived)
// are intentionally excluded.
//
// undefined fields must be dropped rather than kept — JSON.stringify drops
// them on write and JSON.parse can't recover them on read, which would
// cause toStrictEqual to fail on round-trip.
function normalizeReport(r: BlogAuditOutput): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify({
      summary: {
        overall_score: r.summary.overall_score,
        rating: r.summary.rating,
      },
      sections: r.sections.map((s) => ({
        id: s.id,
        title: s.title,
        weight: s.weight,
        score: s.score,
        applicable_checks: s.applicable_checks,
        pass_count: s.pass_count,
        fail_count: s.fail_count,
        na_count: s.na_count,
        unverifiable_count: s.unverifiable_count,
        checks: s.checks.map((c) => {
          const out: Record<string, unknown> = {
            id: c.id,
            label: c.label,
            status: c.status,
            evidence: c.evidence,
          };
          const fix = (c as { exact_fix?: string }).exact_fix;
          if (typeof fix === "string") out.exact_fix = fix;
          return out;
        }),
      })),
    })
  );
}

function buildAuditInput(pkg: {
  request: Record<string, unknown>;
  article: Record<string, unknown>;
  html: string;
  json_ld: Record<string, unknown>;
  json_ld_string: string;
  references: unknown[];
  validation: { warnings: string[]; uncited_source_ids: string[] };
}): Parameters<typeof auditBlogPackage>[0] {
  return {
    request: {
      topic: pkg.request.topic,
      primary_keyword: pkg.request.primary_keyword,
      secondary_keywords: pkg.request.secondary_keywords,
      search_intent: pkg.request.search_intent,
      brand_name: pkg.request.brand_name,
      canonical_url: pkg.request.canonical_url,
      source_count: pkg.request.source_count,
    },
    article: pkg.article,
    html: pkg.html,
    json_ld: pkg.json_ld,
    json_ld_string: pkg.json_ld_string,
    references: pkg.references,
    validation: pkg.validation,
  } as Parameters<typeof auditBlogPackage>[0];
}

beforeAll(() => {
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }
});

const packages = listPackageFiles();

describe("auditor equivalence — generated fixtures", () => {
  if (packages.length === 0) {
    it.skip("no *.package.json fixtures in examples/generated — skipping", () => {});
    return;
  }

  for (const file of packages) {
    const slug = file.replace(/\.package\.json$/, "");
    const sourcePath = path.join(GENERATED_DIR, file);
    const expectedPath = path.join(FIXTURES_DIR, `${slug}.expected.json`);

    it(`matches snapshot for ${slug}`, () => {
      const raw = fs.readFileSync(sourcePath, "utf-8");
      let pkg: Parameters<typeof buildAuditInput>[0];
      try {
        pkg = JSON.parse(raw);
      } catch (err) {
        throw new Error(`Failed to parse ${file}: ${(err as Error).message}`);
      }

      const input = buildAuditInput(pkg);
      const report = auditBlogPackage(input);
      const normalized = normalizeReport(report);

      if (UPDATE || !fs.existsSync(expectedPath)) {
        fs.writeFileSync(
          expectedPath,
          JSON.stringify(normalized, null, 2) + "\n",
          "utf-8"
        );
        if (!fs.existsSync(expectedPath)) {
          throw new Error(
            `Snapshot write failed for ${slug} — cannot continue`
          );
        }
        // When recording, the test still counts as a pass.
        return;
      }

      const expectedRaw = fs.readFileSync(expectedPath, "utf-8");
      const expected = JSON.parse(expectedRaw);

      // Use deep equality. If this diverges, vitest prints the exact diff.
      expect(normalized).toStrictEqual(expected);
    });
  }
});

afterAll(() => {
  if (UPDATE) {
    // Make sure the run that records snapshots is explicit — print a reminder
    // so a CI accidentally running with UPDATE=1 is obvious.
    // eslint-disable-next-line no-console
    console.warn(
      "\n[auditor-equivalence] UPDATE_AUDITOR_SNAPSHOTS=1 was set — fixtures may have been rewritten."
    );
  }
});

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

// ─────────────────────────────────────────────────────────────────────────────
// Ensures rules/blog-rules.json stays in sync with src/blog/auditor.ts.
//
// Every makeCheck("ID", ...) call in auditor.ts must have a matching rule
// entry (by ID) in blog-rules.json, and every non-deprecated rule must have a
// matching check in auditor.ts. This is the governance gate that prevents
// the catalog from silently drifting from the code.
//
// Deprecated rules (handshake v1.1+) DO NOT require a live auditor check —
// they are kept in the catalog for lineage and superseded_by pointers. They
// are eligible for code removal in the Phase 4 scope-reduction work.
// ─────────────────────────────────────────────────────────────────────────────

const RULES_PATH = path.resolve(__dirname, "..", "rules", "blog-rules.json");
const AUDITOR_PATH = path.resolve(__dirname, "..", "src", "blog", "auditor.ts");

type AuditorCheck = { id: string; label: string };
type Rule = {
  id: string;
  title: string;
  deprecated?: boolean;
  authority?: string;
  superseded_by?: string;
};

function extractAuditorCheckIds(): AuditorCheck[] {
  const source = fs.readFileSync(AUDITOR_PATH, "utf-8");
  const re = /makeCheck\(\s*"([A-Z]\d+)"\s*,\s*"([^"]+)"/g;
  const out: AuditorCheck[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    out.push({ id: m[1], label: m[2] });
  }
  return out;
}

function loadRules(): Rule[] {
  const data = JSON.parse(fs.readFileSync(RULES_PATH, "utf-8"));
  return data.rules as Rule[];
}

describe("rules/blog-rules.json ↔ auditor.ts coverage", () => {
  it("every auditor check has a rule entry with a matching title", () => {
    const auditorChecks = extractAuditorCheckIds();
    const rules = loadRules();
    const rulesById = new Map(rules.map((r) => [r.id, r]));

    const missing: string[] = [];
    const titleMismatch: string[] = [];

    for (const check of auditorChecks) {
      const rule = rulesById.get(check.id);
      if (!rule) {
        missing.push(`${check.id} — "${check.label}"`);
        continue;
      }
      if (rule.title !== check.label) {
        titleMismatch.push(
          `${check.id}: auditor="${check.label}" vs rule="${rule.title}"`
        );
      }
    }

    if (missing.length) {
      console.error("\nMissing from blog-rules.json:\n  " + missing.join("\n  "));
    }
    if (titleMismatch.length) {
      console.error(
        "\nTitle mismatch between auditor and rules (update blog-rules.json):\n  " +
          titleMismatch.join("\n  ")
      );
    }

    expect(missing).toEqual([]);
    expect(titleMismatch).toEqual([]);
  });

  it("every non-deprecated rule maps to a live auditor check", () => {
    const auditorIds = new Set(extractAuditorCheckIds().map((c) => c.id));
    const liveRules = loadRules().filter((r) => r.deprecated !== true);

    const orphans = liveRules.filter((r) => !auditorIds.has(r.id));
    if (orphans.length) {
      console.error(
        "\nLive rules missing an auditor implementation (add the check or mark deprecated):\n  " +
          orphans.map((r) => `${r.id} — "${r.title}"`).join("\n  ")
      );
    }
    expect(orphans).toEqual([]);
  });

  it("auditor IDs are a superset of live rule IDs (deprecated rules may still have code pending Phase 4 cleanup)", () => {
    const auditorIds = new Set(extractAuditorCheckIds().map((c) => c.id));
    const liveRuleIds = new Set(
      loadRules()
        .filter((r) => r.deprecated !== true)
        .map((r) => r.id)
    );

    // Every live rule must appear in the auditor; the auditor may still
    // contain code for deprecated rules until Phase 4 removes them.
    const missingAuditor = Array.from(liveRuleIds).filter(
      (id) => !auditorIds.has(id)
    );
    expect(missingAuditor).toEqual([]);
  });
});
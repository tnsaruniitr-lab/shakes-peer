import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

// ─────────────────────────────────────────────────────────────────────────────
// Ensures rules/blog-rules.json stays in sync with src/blog/auditor.ts.
//
// Every makeCheck("ID", ...) call in auditor.ts must have a matching rule
// entry (by ID) in blog-rules.json, and vice versa. This is the governance
// gate that prevents the catalog from silently drifting from the code.
//
// When a new check is added to auditor.ts without a rule entry, this test
// fails with a precise list of missing IDs. Same the other way.
// ─────────────────────────────────────────────────────────────────────────────

const RULES_PATH = path.resolve(__dirname, "..", "rules", "blog-rules.json");
const AUDITOR_PATH = path.resolve(__dirname, "..", "src", "blog", "auditor.ts");

function extractAuditorCheckIds(): { id: string; label: string }[] {
  const source = fs.readFileSync(AUDITOR_PATH, "utf-8");
  // Match `makeCheck("<ID>", "<LABEL>", ...)` — IDs are <SectionLetter><digit+>
  const re = /makeCheck\(\s*"([A-Z]\d+)"\s*,\s*"([^"]+)"/g;
  const out: { id: string; label: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    out.push({ id: m[1], label: m[2] });
  }
  return out;
}

function loadRuleIds(): { id: string; title: string }[] {
  const data = JSON.parse(fs.readFileSync(RULES_PATH, "utf-8"));
  return data.rules.map((r: { id: string; title: string }) => ({
    id: r.id,
    title: r.title,
  }));
}

describe("rules/blog-rules.json ↔ auditor.ts coverage", () => {
  it("every auditor check has a rule entry with a matching title", () => {
    const auditorChecks = extractAuditorCheckIds();
    const rules = loadRuleIds();
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

  it("every rule in blog-rules.json maps to a check in auditor.ts", () => {
    const auditorChecks = extractAuditorCheckIds();
    const auditorIds = new Set(auditorChecks.map((c) => c.id));
    const rules = loadRuleIds();

    const orphans = rules.filter((r) => !auditorIds.has(r.id));
    if (orphans.length) {
      console.error(
        "\nOrphan rules (in JSON but no auditor check — either add the check or mark rule deprecated):\n  " +
          orphans.map((r) => `${r.id} — "${r.title}"`).join("\n  ")
      );
    }
    expect(orphans).toEqual([]);
  });

  it("auditor and rules have the exact same ID set", () => {
    const auditorIds = new Set(extractAuditorCheckIds().map((c) => c.id));
    const ruleIds = new Set(loadRuleIds().map((r) => r.id));
    expect(Array.from(auditorIds).sort()).toEqual(
      Array.from(ruleIds).sort()
    );
  });
});

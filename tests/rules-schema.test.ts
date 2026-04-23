import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Tests that rules/blog-rules.json itself is well-formed.
//
// These are NOT tests of the auditor — they test the rules catalog as data.
// Breaking any of these means the catalog violates its own schema and will
// confuse any consumer that reads from it.
// ─────────────────────────────────────────────────────────────────────────────

const RULES_PATH = path.resolve(__dirname, "..", "rules", "blog-rules.json");

const SectionSchema = z.object({
  id: z.string().regex(/^[A-Z]$/),
  title: z.string().min(1),
  weight: z.number().int().positive(),
});

const RuleSchema = z.object({
  id: z.string().regex(/^[A-Z]\d+$/, "Rule IDs must match letter+number, e.g. A1, F7"),
  section: z.string().regex(/^[A-Z]$/),
  title: z.string().min(1),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  tier: z.number().int().min(1).max(8),
  applies_to: z.array(z.string()).min(1),
  verification_method: z.string().min(1),
  generation_instruction: z.string().min(1),
  source: z.array(z.string()).min(1),
  deprecated: z.boolean().optional(),
  // ─── Handshake contract v1.1 additions ────────────────────────────────────
  // authority declares who is the source of truth for this rule:
  //   shakespeer       — runs in our auditor only (or as preflight)
  //   blog-buster      — deprecated here, live in blog-buster
  //   shared-preflight — we detect first, blog-buster confirms/rejects/extends
  authority: z.enum(["shakespeer", "blog-buster", "shared-preflight"]).optional(),
  // Pointer to the blog-buster check that replaces this one (when deprecated).
  superseded_by: z.string().optional(),
  // Flag for checks where blog-buster claims coverage — verified during Phase 1 smoke.
  coverage_verification_pending: z.boolean().optional(),
});

const RulesFileSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().min(1),
  effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  legend: z.object({
    tiers: z.record(z.string()),
    severity: z.record(z.string()),
    applies_to: z.array(z.string()),
    authority: z.record(z.string()).optional(),
  }),
  sections: z.array(SectionSchema).min(1),
  rules: z.array(RuleSchema).min(1),
});

function loadRules() {
  const raw = fs.readFileSync(RULES_PATH, "utf-8");
  return JSON.parse(raw);
}

describe("blog-rules.json — file schema", () => {
  it("parses as valid JSON and matches the declared schema", () => {
    const data = loadRules();
    const parsed = RulesFileSchema.safeParse(data);
    if (!parsed.success) {
      // Dump readable errors so CI failures are actionable
      console.error(JSON.stringify(parsed.error.flatten(), null, 2));
    }
    expect(parsed.success).toBe(true);
  });

  it("declares version 1.0.0 or higher and an ISO effective_date", () => {
    const data = loadRules();
    expect(data.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(new Date(data.effective_date).toString()).not.toBe("Invalid Date");
  });
});

describe("blog-rules.json — rule invariants", () => {
  it("rule IDs are unique", () => {
    const data = loadRules();
    const ids = data.rules.map((r: { id: string }) => r.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("every rule.section references an existing section", () => {
    const data = loadRules();
    const sectionIds = new Set(data.sections.map((s: { id: string }) => s.id));
    for (const rule of data.rules) {
      expect(sectionIds.has(rule.section)).toBe(true);
    }
  });

  it("every rule.id starts with its section letter", () => {
    const data = loadRules();
    for (const rule of data.rules) {
      expect(rule.id.startsWith(rule.section)).toBe(true);
    }
  });

  it("applies_to entries are from the declared allowlist", () => {
    const data = loadRules();
    const allowed = new Set(data.legend.applies_to);
    for (const rule of data.rules) {
      for (const scope of rule.applies_to) {
        expect(allowed.has(scope)).toBe(true);
      }
    }
  });

  it("tier values are within declared legend range (1-8)", () => {
    const data = loadRules();
    const allowedTiers = new Set(Object.keys(data.legend.tiers).map(Number));
    for (const rule of data.rules) {
      expect(allowedTiers.has(rule.tier)).toBe(true);
    }
  });

  it("severity values are from the declared allowlist", () => {
    const data = loadRules();
    const allowed = new Set(Object.keys(data.legend.severity));
    for (const rule of data.rules) {
      expect(allowed.has(rule.severity)).toBe(true);
    }
  });
});

describe("blog-rules.json — severity vs tier policy", () => {
  // Core determinism promise: CRITICAL rules must be objectively verifiable.
  // Tiers 6+ are heuristic (NLP) or LLM-judge and cannot reliably be CRITICAL.
  it("no CRITICAL rule has tier > 5", () => {
    const data = loadRules();
    const offenders = data.rules.filter(
      (r: { severity: string; tier: number }) =>
        r.severity === "CRITICAL" && r.tier > 5
    );
    if (offenders.length) {
      console.error(
        "CRITICAL rules above tier 5:",
        offenders.map((o: { id: string; tier: number }) => `${o.id}(tier ${o.tier})`)
      );
    }
    expect(offenders).toEqual([]);
  });

  it("HIGH rules never sit at tier 8 (human-only)", () => {
    const data = loadRules();
    const offenders = data.rules.filter(
      (r: { severity: string; tier: number }) =>
        r.severity === "HIGH" && r.tier === 8
    );
    expect(offenders).toEqual([]);
  });
});

describe("blog-rules.json — section invariants", () => {
  it("section IDs are unique", () => {
    const data = loadRules();
    const ids = data.sections.map((s: { id: string }) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("section weights are positive integers", () => {
    const data = loadRules();
    for (const s of data.sections) {
      expect(s.weight).toBeGreaterThan(0);
      expect(Number.isInteger(s.weight)).toBe(true);
    }
  });

  it("every section has at least one rule", () => {
    const data = loadRules();
    const rulesBySection = new Map<string, number>();
    for (const r of data.rules) {
      rulesBySection.set(r.section, (rulesBySection.get(r.section) ?? 0) + 1);
    }
    for (const s of data.sections) {
      expect(rulesBySection.get(s.id) ?? 0).toBeGreaterThan(0);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Handshake contract invariants (v1.1+).
// Enforces the rules declared in docs/handshake-contract.md §3 and §11.
// ─────────────────────────────────────────────────────────────────────────────

describe("blog-rules.json — handshake invariants", () => {
  it("every rule declares an authority", () => {
    const data = loadRules();
    const missing = data.rules.filter(
      (r: { authority?: string }) => !r.authority
    );
    if (missing.length) {
      console.error(
        "Rules missing authority:",
        missing.map((r: { id: string }) => r.id)
      );
    }
    expect(missing).toEqual([]);
  });

  it("every deprecated rule points to its successor via superseded_by", () => {
    const data = loadRules();
    const orphans = data.rules.filter(
      (r: { deprecated?: boolean; superseded_by?: string }) =>
        r.deprecated === true && !r.superseded_by
    );
    if (orphans.length) {
      console.error(
        "Deprecated rules without superseded_by:",
        orphans.map((r: { id: string }) => r.id)
      );
    }
    expect(orphans).toEqual([]);
  });

  it("deprecated rules always have authority: blog-buster", () => {
    const data = loadRules();
    const mismatched = data.rules.filter(
      (r: { deprecated?: boolean; authority?: string }) =>
        r.deprecated === true && r.authority !== "blog-buster"
    );
    expect(mismatched).toEqual([]);
  });

  it("non-deprecated rules have authority shakespeer or shared-preflight", () => {
    const data = loadRules();
    const mismatched = data.rules.filter(
      (r: { deprecated?: boolean; authority?: string }) =>
        r.deprecated !== true &&
        r.authority !== "shakespeer" &&
        r.authority !== "shared-preflight"
    );
    expect(mismatched).toEqual([]);
  });

  it("superseded_by values are namespaced (contain a colon)", () => {
    const data = loadRules();
    const bad = data.rules
      .filter((r: { superseded_by?: string }) => r.superseded_by)
      .filter(
        (r: { superseded_by?: string }) => !r.superseded_by?.includes(":")
      );
    expect(bad).toEqual([]);
  });
});

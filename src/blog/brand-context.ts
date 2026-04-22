import fs from "node:fs";
import path from "node:path";
import type { BlogWriterRequest } from "./types.js";

interface BrandNavItem {
  label: string;
  href: string;
  aria_label?: string;
}

interface BrandFacts {
  brand_name?: string;
  canonical_domain?: string;
  support_email?: string;
  product_summary?: string;
  navigation?: BrandNavItem[];
  footer_navigation?: Array<{ label: string; href: string }>;
  voice?: {
    tone?: string[];
    banned_phrases?: string[];
  };
  truth_boundary?: Record<string, unknown>;
}

export interface LoadedBrandContext {
  markdown?: string;
  facts?: BrandFacts;
}

function projectRoot(): string {
  return process.cwd();
}

function tryReadFile(filePath: string): string | undefined {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return undefined;
  }
}

function tryReadJson<T>(filePath: string): T | undefined {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return undefined;
  }
}

export function shouldUseTrypsBrandContext(input: Pick<BlogWriterRequest, "brand">): boolean {
  return (
    /tryps/i.test(input.brand.name) ||
    /trypsagent\.com/i.test(input.brand.domain) ||
    /jointryps\.com/i.test(input.brand.domain)
  );
}

export function loadBrandContext(input: Pick<BlogWriterRequest, "brand">): LoadedBrandContext {
  if (!shouldUseTrypsBrandContext(input)) {
    return {};
  }

  const root = projectRoot();
  return {
    markdown: tryReadFile(path.join(root, "brand", "tryps-brand.md")),
    facts: tryReadJson<BrandFacts>(path.join(root, "brand", "tryps-brand-facts.json")),
  };
}

export function applyBrandContext(input: BlogWriterRequest): BlogWriterRequest {
  const context = loadBrandContext(input);
  const facts = context.facts;
  if (!facts) {
    return input;
  }

  return {
    ...input,
    brand: {
      ...input.brand,
      name: facts.brand_name ?? input.brand.name,
      domain: facts.canonical_domain ?? input.brand.domain,
      product_description: facts.product_summary ?? input.brand.product_description,
      tone_of_voice:
        facts.voice?.tone?.length && !input.brand.tone_of_voice
          ? facts.voice.tone.join(", ")
          : input.brand.tone_of_voice,
    },
  };
}

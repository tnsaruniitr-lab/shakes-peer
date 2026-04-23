// Re-render audit reports for an existing blog folder using the per-version
// JSON already on disk. Cheap — no audit calls, no git ops, just regenerate
// the human-readable markdown (README, per-version audit-report.md, final/
// audit-report.md) so readers see the latest rendering template.
//
// Usage:  node scripts/re-render-reports.mjs <blog-slug>

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/re-render-reports.mjs <blog-folder-name>");
  process.exit(1);
}
const blogRoot = path.join(ROOT, "blogs", slug);
if (!fs.existsSync(blogRoot)) {
  console.error(`✗ blog folder not found: ${blogRoot}`);
  process.exit(1);
}

const { writeHistory, writeVersion } = await import(
  path.join(ROOT, "dist", "blog", "version-store.js")
);

// Reload history.json + each version's existing files and re-invoke the writers.
const history = JSON.parse(fs.readFileSync(path.join(blogRoot, "history.json"), "utf-8"));
const blog = { root: blogRoot, slug };

// Re-render each version's audit-report.md by calling writeVersion with what
// we already have — it re-writes all the same files but also regenerates the
// human-readable report.
for (const v of history.versions) {
  const vDir = path.join(blogRoot, `v${v.version}`);
  if (!fs.existsSync(vDir)) continue;

  const read = (name) => {
    const p = path.join(vDir, name);
    return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf-8")) : null;
  };

  const html = fs.existsSync(path.join(vDir, "index.html"))
    ? fs.readFileSync(path.join(vDir, "index.html"), "utf-8")
    : "";
  const jsonLd = read("jsonld.json") ?? [];
  const metaTags = read("meta.json") ?? {};
  const auditFull = read("audit.full.json");
  const dispatch = read("dispatch.json");
  const openItems = read("open-items.json") ?? [];
  const markdown = fs.existsSync(path.join(vDir, "index.md"))
    ? fs.readFileSync(path.join(vDir, "index.md"), "utf-8")
    : null;

  writeVersion(blog, v.version, {
    html,
    jsonLd,
    metaTags,
    auditFull,
    dispatch,
    openItems,
    markdown,
  });
  console.log(`✓ v${v.version}: audit-report.md regenerated`);
}

// Finally re-render the README + final/audit-report.md using the existing history.json.
writeHistory(blog, history);
console.log(`✓ README + final/audit-report.md regenerated`);

console.log(`\nView them:`);
console.log(`  ${path.relative(ROOT, path.join(blogRoot, "README.md"))}`);
console.log(`  ${path.relative(ROOT, path.join(blogRoot, "v2", "audit-report.md"))}`);
console.log(`  ${path.relative(ROOT, path.join(blogRoot, "final", "audit-report.md"))}`);

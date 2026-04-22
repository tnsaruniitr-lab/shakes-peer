import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { BlogWriterResponse } from "./types.js";

/**
 * Save blog output files to ~/Desktop/shakes-peer/blogs/<slug>/
 * Each generation creates:
 *   - {slug}.preview.html     — the styled preview HTML
 *   - {slug}.html             — the raw article HTML
 *   - {slug}.jsonld.json      — schema.org structured data
 *   - {slug}.package.json     — full writer response (article + html + validation)
 *   - {slug}.checklist.json   — editorial integrity checklist snapshot
 *
 * The Desktop path is intentionally decoupled from the git repo so working
 * drafts don't pollute commits. The writer also persists examples/generated/
 * inside the repo for reference blogs the team wants version-controlled.
 */
export function saveBlogToDesktop(
  result: BlogWriterResponse,
  audit?: Record<string, unknown>
): { folder: string; files: string[] } {
  const desktopBase = path.join(
    os.homedir(),
    "Desktop",
    "shakes-peer",
    "blogs"
  );
  const slug = result.article.slug || "untitled-" + Date.now();
  const brandSlug = (result.request.brand_name || "brand")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const folder = path.join(desktopBase, `${brandSlug}-${slug}`);

  fs.mkdirSync(folder, { recursive: true });

  const files: string[] = [];
  const write = (name: string, content: string) => {
    const fp = path.join(folder, name);
    fs.writeFileSync(fp, content, "utf-8");
    files.push(fp);
  };

  write(`${slug}.preview.html`, result.preview_html);
  write(`${slug}.html`, result.html);
  write(`${slug}.jsonld.json`, JSON.stringify(result.json_ld, null, 2));
  write(`${slug}.package.json`, JSON.stringify(result, null, 2));
  write(
    `${slug}.checklist.json`,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        brand: result.request.brand_name,
        title: result.article.title,
        publish_ready: result.publish_ready,
        checklist_passed: result.checklist_passed,
        checklist_total: result.checklist_total,
        editorial_checklist: result.editorial_checklist,
        human_signal_gaps: result.validation.human_signal_gaps,
        pending_visual_placements: result.validation.pending_visual_placements,
      },
      null,
      2
    )
  );

  if (audit) {
    write(`${slug}.audit.json`, JSON.stringify(audit, null, 2));
  }

  // Also write a top-level index.json tracking all generated blogs
  const indexPath = path.join(desktopBase, "index.json");
  let index: Array<Record<string, unknown>> = [];
  if (fs.existsSync(indexPath)) {
    try {
      index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    } catch {
      index = [];
    }
  }
  index.unshift({
    generated_at: new Date().toISOString(),
    brand: result.request.brand_name,
    slug,
    title: result.article.title,
    publish_ready: result.publish_ready,
    checklist_passed: result.checklist_passed,
    checklist_total: result.checklist_total,
    folder: path.relative(desktopBase, folder),
  });
  // Keep index bounded to the last 500 entries
  index = index.slice(0, 500);
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), "utf-8");

  return { folder, files };
}

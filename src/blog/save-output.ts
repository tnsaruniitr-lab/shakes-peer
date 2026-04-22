import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { BlogWriterResponse, BlogWriterRequest } from "./types.js";
import { renderBlogMarkdown } from "./markdown.js";

// ─────────────────────────────────────────────────────────────────────────────
// Persistence for every generated blog.
//
// Two destinations, two purposes:
//
// 1. ~/Desktop/shakes-peer/blogs/<brand-slug>-<post-slug>/
//      Full working set — preview.html, article html, json-ld, package, audit,
//      checklist, markdown. Used for local review and drafting.
//
// 2. <repo>/blogs/<post-slug>.md
//      Canonical markdown only. The portable source of truth. Version-controlled
//      via the auto-sync hook so every generation shows up in GitHub history.
//      HTML and JSON-LD are derived renders — they stay out of the repo.
//
// The markdown file is the thing a CMS, static-site generator, or future
// migration can consume without re-running the writer.
// ─────────────────────────────────────────────────────────────────────────────

const REPO_BLOGS_DIR = path.resolve(
  new URL(".", import.meta.url).pathname,
  "..",
  "..",
  "blogs"
);

function brandSlug(brandName: string | undefined | null): string {
  return (brandName || "brand")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function desktopBaseDir(): string {
  return path.join(os.homedir(), "Desktop", "shakes-peer", "blogs");
}

export function saveBlogToDesktop(
  result: BlogWriterResponse,
  audit?: Record<string, unknown>,
  request?: BlogWriterRequest
): { folder: string; files: string[]; repo_markdown: string | null } {
  const slug = result.article.slug || "untitled-" + Date.now();
  const desktopBase = desktopBaseDir();
  const desktopFolder = path.join(desktopBase, `${brandSlug(result.request.brand_name)}-${slug}`);
  fs.mkdirSync(desktopFolder, { recursive: true });

  const files: string[] = [];
  const write = (folder: string, name: string, content: string) => {
    const fp = path.join(folder, name);
    fs.writeFileSync(fp, content, "utf-8");
    files.push(fp);
  };

  // Build the canonical markdown once — written to both destinations.
  let markdown: string | null = null;
  if (request) {
    try {
      markdown = renderBlogMarkdown(request, result.article, {
        publishedIso: request.article.published_at ?? new Date().toISOString(),
        modifiedIso: request.article.modified_at ?? new Date().toISOString(),
        canonical_url: result.request.canonical_url,
        editorial_checklist: result.editorial_checklist,
      });
    } catch (err) {
      console.warn("[save-output] Failed to render markdown:", err);
    }
  }

  // ─── Destination 1: Desktop working set ──────────────────────────────────
  write(desktopFolder, `${slug}.preview.html`, result.preview_html);
  write(desktopFolder, `${slug}.html`, result.html);
  write(desktopFolder, `${slug}.jsonld.json`, JSON.stringify(result.json_ld, null, 2));
  write(desktopFolder, `${slug}.package.json`, JSON.stringify(result, null, 2));
  write(
    desktopFolder,
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
  if (markdown) {
    write(desktopFolder, `${slug}.md`, markdown);
  }
  if (audit) {
    write(desktopFolder, `${slug}.audit.json`, JSON.stringify(audit, null, 2));
  }

  // Rolling index at the Desktop root — last 500 generations, newest first.
  const desktopIndexPath = path.join(desktopBase, "index.json");
  let index: Array<Record<string, unknown>> = [];
  if (fs.existsSync(desktopIndexPath)) {
    try {
      index = JSON.parse(fs.readFileSync(desktopIndexPath, "utf-8"));
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
    folder: path.relative(desktopBase, desktopFolder),
  });
  index = index.slice(0, 500);
  fs.writeFileSync(desktopIndexPath, JSON.stringify(index, null, 2), "utf-8");

  // ─── Destination 2: Repo blogs/ folder (canonical markdown only) ──────────
  let repoMarkdownPath: string | null = null;
  if (markdown) {
    try {
      fs.mkdirSync(REPO_BLOGS_DIR, { recursive: true });
      repoMarkdownPath = path.join(REPO_BLOGS_DIR, `${slug}.md`);
      fs.writeFileSync(repoMarkdownPath, markdown, "utf-8");

      // Maintain an index of repo blogs for discoverability on GitHub.
      updateRepoIndex(result, slug);
    } catch (err) {
      console.warn("[save-output] Failed to write repo markdown:", err);
      repoMarkdownPath = null;
    }
  }

  return {
    folder: desktopFolder,
    files,
    repo_markdown: repoMarkdownPath,
  };
}

/**
 * Rewrite blogs/README.md as a sortable index of all markdown posts in the
 * folder. Doing this on every generation means the index is always fresh,
 * and any blog added/removed by hand still shows up correctly.
 */
function updateRepoIndex(
  result: BlogWriterResponse,
  _slug: string
): void {
  const indexPath = path.join(REPO_BLOGS_DIR, "README.md");
  const files = fs
    .readdirSync(REPO_BLOGS_DIR)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .sort();

  const rows = files.map((file) => {
    const fp = path.join(REPO_BLOGS_DIR, file);
    const stat = fs.statSync(fp);
    const content = fs.readFileSync(fp, "utf-8").slice(0, 2000);
    const titleMatch = content.match(/^title:\s*(.+)$/m);
    const brandMatch = content.match(/^brand:\s*(.+)$/m);
    const dateMatch = content.match(/^published_at:\s*(\S+)/m);
    const reviewMatch = content.match(/^next_review_date:\s*(\S+)/m);
    const title = titleMatch ? titleMatch[1].replace(/^"|"$/g, "") : file;
    const brand = brandMatch ? brandMatch[1].replace(/^"|"$/g, "") : "—";
    const date = dateMatch ? dateMatch[1] : stat.mtime.toISOString().slice(0, 10);
    const nextReview = reviewMatch ? reviewMatch[1] : "—";
    return `| [${title}](./${file}) | ${brand} | ${date} | ${nextReview} |`;
  });

  const header = [
    "# Generated blogs",
    "",
    "Canonical markdown source for every post written by Shakes-peer. HTML and JSON-LD renders are stored separately; this is the portable representation that survives CMS migrations.",
    "",
    `Total posts: ${files.length}${result ? "" : ""}`,
    "",
    "| Title | Brand | Published | Next review |",
    "| --- | --- | --- | --- |",
  ];

  const body = rows.length ? rows.join("\n") : "_No posts generated yet._";
  fs.writeFileSync(indexPath, `${header.join("\n")}\n${body}\n`, "utf-8");
}

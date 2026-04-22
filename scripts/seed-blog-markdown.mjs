// Seed blogs/ folder with canonical markdown for every existing generated post.
//
// Reads examples/generated/*.package.json (writer responses) and produces
// blogs/<slug>.md using the same renderBlogMarkdown the routes use live.
//
// Reconstructs the BlogWriterRequest from what's recoverable in the package
// (request metadata + references) — optional fields (author, editorial stance,
// first-party data) aren't persisted in the package, so they're omitted here.
// The markdown will still be valid and renderable; it just won't have author
// blocks or stance quotes for these historical posts.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderBlogMarkdown } from "../dist/blog/markdown.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GENERATED = path.join(ROOT, "examples", "generated");
const BLOGS = path.join(ROOT, "blogs");

fs.mkdirSync(BLOGS, { recursive: true });

const files = fs
  .readdirSync(GENERATED)
  .filter((f) => f.endsWith(".package.json"))
  .sort();

console.log(`Found ${files.length} packages to seed.`);

for (const file of files) {
  const pkgPath = path.join(GENERATED, file);
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

  // Reconstruct the minimum BlogWriterRequest the renderer needs.
  const request = {
    topic: pkg.request.topic ?? pkg.article.title,
    primary_keyword: pkg.request.primary_keyword,
    secondary_keywords: pkg.request.secondary_keywords ?? [],
    search_intent: pkg.request.search_intent ?? "informational",
    post_format: pkg.article.format,
    enforce_human_signals: false,
    first_party_data: [],
    named_examples: [],
    original_visuals: [],
    brand: {
      name: pkg.request.brand_name,
      domain: pkg.request.canonical_url?.match(/^https?:\/\/([^/]+)/)?.[1] ?? "",
      product_description: pkg.article.excerpt ?? "",
      tone_of_voice: "clear, specific, authoritative",
      differentiators: [],
    },
    sources: pkg.references ?? [],
    article: {
      slug: pkg.article.slug,
      target_word_count: 1800,
      include_faq: (pkg.article.faq?.length ?? 0) > 0,
      include_howto_schema: false,
      include_comparison_table: false,
      author_name: "Editorial Team",
      category: pkg.article.category ?? "Blog",
    },
    model: "gpt-4.1",
  };

  const md = renderBlogMarkdown(request, pkg.article, {
    canonical_url: pkg.request.canonical_url,
    editorial_checklist: pkg.editorial_checklist,
  });

  const outPath = path.join(BLOGS, `${pkg.article.slug}.md`);
  fs.writeFileSync(outPath, md, "utf-8");
  console.log(`  ✓ ${path.relative(ROOT, outPath)}`);
}

// Rebuild README index
const mdFiles = fs
  .readdirSync(BLOGS)
  .filter((f) => f.endsWith(".md") && f !== "README.md")
  .sort();

const rows = mdFiles.map((file) => {
  const content = fs.readFileSync(path.join(BLOGS, file), "utf-8").slice(0, 2000);
  const title = content.match(/^title:\s*(.+)$/m)?.[1].replace(/^"|"$/g, "") ?? file;
  const brand = content.match(/^brand:\s*(.+)$/m)?.[1].replace(/^"|"$/g, "") ?? "—";
  const date = content.match(/^published_at:\s*(\S+)/m)?.[1] ?? "—";
  const review = content.match(/^next_review_date:\s*(\S+)/m)?.[1] ?? "—";
  return `| [${title}](./${file}) | ${brand} | ${date} | ${review} |`;
});

const readme =
  `# Generated blogs\n\n` +
  `Canonical markdown source for every post written by Shakes-peer. HTML and JSON-LD renders are stored separately; this is the portable representation that survives CMS migrations.\n\n` +
  `Total posts: ${mdFiles.length}\n\n` +
  `| Title | Brand | Published | Next review |\n| --- | --- | --- | --- |\n` +
  rows.join("\n") +
  "\n";

fs.writeFileSync(path.join(BLOGS, "README.md"), readme, "utf-8");
console.log(`\n✓ Seeded ${mdFiles.length} blog(s) + README index.`);

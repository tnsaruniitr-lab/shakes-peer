import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { generateBlogPackageWithAuditLoops } from "../dist/blog/pipeline.js";

dotenv.config({ path: ".env", override: true });

const inputArg = process.argv[2];
const outputDirArg = process.argv[3] ?? "examples/generated";
const loopsArg = Number(process.argv[4] ?? "2");

if (!inputArg) {
  console.error("Usage: node scripts/generate-blog.mjs <input.json> [output-dir] [improvement-loops]");
  process.exit(1);
}

const inputPath = path.resolve(inputArg);
const outputDir = path.resolve(outputDirArg);
const baseName = path.basename(inputPath, path.extname(inputPath));

const raw = await fs.readFile(inputPath, "utf8");
const input = JSON.parse(raw);
const result = await generateBlogPackageWithAuditLoops(input, {
  improvement_loops: loopsArg,
});

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(
  path.join(outputDir, `${baseName}.package.json`),
  JSON.stringify(result.blog_package, null, 2)
);
await fs.writeFile(
  path.join(outputDir, `${baseName}.audit.json`),
  JSON.stringify(result.audit, null, 2)
);
await fs.writeFile(
  path.join(outputDir, `${baseName}.iterations.json`),
  JSON.stringify(result.iterations, null, 2)
);
await fs.writeFile(
  path.join(outputDir, `${baseName}.html`),
  result.blog_package.html
);
await fs.writeFile(
  path.join(outputDir, `${baseName}.preview.html`),
  result.blog_package.preview_html
);
await fs.writeFile(
  path.join(outputDir, `${baseName}.jsonld.json`),
  JSON.stringify(result.blog_package.json_ld, null, 2)
);

console.log(
  JSON.stringify(
    {
      canonical: result.blog_package.request.canonical_url,
      score: result.audit.summary.overall_score,
      rating: result.audit.summary.rating,
      iterations: result.iterations,
      output_dir: outputDir,
    },
    null,
    2
  )
);

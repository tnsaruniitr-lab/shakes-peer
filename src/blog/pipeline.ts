import OpenAI from "openai";
import {
  BlogDraftSchema,
  BlogWriterRequestSchema,
  type BlogDraft,
  type BlogWriterRequest,
  type BlogWriterResponse,
} from "./types.js";
import { auditBlogPackage } from "./auditor.js";
import { buildBlogPackageFromDraft, generateBlogPackage } from "./writer.js";

interface ImprovementLoopSummary {
  iteration: number;
  stage: "initial" | "improved";
  score: number | null;
  rating: string;
  fix_count: number;
}

export interface BlogPipelineResponse {
  blog_package: BlogWriterResponse;
  audit: ReturnType<typeof auditBlogPackage>;
  iterations: ImprovementLoopSummary[];
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  return text.slice(start, end + 1);
}

function buildRevisionPrompt(
  input: BlogWriterRequest,
  currentPackage: BlogWriterResponse,
  audit: ReturnType<typeof auditBlogPackage>,
  iteration: number
): string {
  return `You are revising a blog draft after an automated SEO/AEO/GEO audit.

Goal:
- improve the article meaningfully
- keep valid structure and citations
- fix issues flagged by the audit where they make sense
- preserve the brand voice and factual discipline

Original brief:
${JSON.stringify(input, null, 2)}

Current article JSON:
${JSON.stringify(currentPackage.article, null, 2)}

Audit summary:
${JSON.stringify(audit.summary, null, 2)}

Audit fix summary:
${JSON.stringify(audit.fix_summary, null, 2)}

Revision rules:
- Return ONLY a valid JSON object matching the same article schema as the current article JSON.
- Keep all citation_ids limited to the provided source ids in the brief.
- Do not invent facts, prices, features, dates, comparisons, or product claims.
- Improve the title, meta fields, structure, FAQ quality, comparison clarity, CTA clarity, and HTML-renderability where needed.
- If the audit feedback conflicts with the original brief, prefer the original brief.
- If a comparison table is useful, include it as raw HTML inside a section bullet item so the renderer can output it.
- Try to improve the score on this revision pass ${iteration}.
`;
}

async function reviseDraftFromAudit(
  input: BlogWriterRequest,
  currentPackage: BlogWriterResponse,
  audit: ReturnType<typeof auditBlogPackage>,
  iteration: number
): Promise<BlogDraft> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not set");
  }

  const client = new OpenAI({ apiKey });
  const prompt = buildRevisionPrompt(input, currentPackage, audit, iteration);
  const response = await client.responses.create({
    model: input.model,
    input: prompt,
  });

  const text = "output_text" in response && typeof response.output_text === "string"
    ? response.output_text
    : "";
  const jsonText = extractJsonObject(text);
  if (!jsonText) {
    throw new Error("Revision response did not contain a valid JSON object");
  }

  return BlogDraftSchema.parse(JSON.parse(jsonText));
}

export async function generateBlogPackageWithAuditLoops(
  rawInput: unknown,
  options?: {
    improvement_loops?: number;
    target_score?: number;
  }
): Promise<BlogPipelineResponse> {
  const input = BlogWriterRequestSchema.parse(rawInput);
  const maxLoops = Math.min(Math.max(options?.improvement_loops ?? 2, 0), 3);
  const targetScore = options?.target_score ?? 94;

  let currentPackage = await generateBlogPackage(input);
  let currentAudit = auditBlogPackage(currentPackage);

  const iterations: ImprovementLoopSummary[] = [
    {
      iteration: 0,
      stage: "initial",
      score: currentAudit.summary.overall_score,
      rating: currentAudit.summary.rating,
      fix_count: currentAudit.fix_summary.length,
    },
  ];

  for (let iteration = 1; iteration <= maxLoops; iteration++) {
    const currentScore = currentAudit.summary.overall_score ?? 0;
    if (currentAudit.fix_summary.length === 0 && iteration > 1) {
      break;
    }
    if (currentScore >= targetScore && iteration > 1) {
      break;
    }

    const revisedDraft = await reviseDraftFromAudit(
      input,
      currentPackage,
      currentAudit,
      iteration
    );
    const revisedPackage = buildBlogPackageFromDraft(input, revisedDraft);
    const revisedAudit = auditBlogPackage({
      ...revisedPackage,
      iteration: {
        label: `iteration-${iteration}`,
        previous_score: currentAudit.summary.overall_score ?? 0,
        previous_failed_checks: currentAudit.fix_summary.map((item) => item.check_id),
        fixes_applied: currentAudit.fix_summary.map((item) => item.issue),
      },
    });

    const revisedScore = revisedAudit.summary.overall_score ?? 0;
    const oldScore = currentAudit.summary.overall_score ?? 0;
    const keepRevised =
      revisedScore > oldScore ||
      (revisedScore === oldScore &&
        revisedAudit.fix_summary.length <= currentAudit.fix_summary.length);

    if (keepRevised) {
      currentPackage = revisedPackage;
      currentAudit = revisedAudit;
    }

    iterations.push({
      iteration,
      stage: "improved",
      score: currentAudit.summary.overall_score,
      rating: currentAudit.summary.rating,
      fix_count: currentAudit.fix_summary.length,
    });
  }

  return {
    blog_package: currentPackage,
    audit: currentAudit,
    iterations,
  };
}

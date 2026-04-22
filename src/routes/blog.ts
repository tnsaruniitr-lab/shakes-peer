import { Router, Request, Response } from "express";
import { ZodError } from "zod";
import { generateBlogPackage } from "../blog/writer.js";
import { auditBlogPackage } from "../blog/auditor.js";
import { generateBlogPackageWithAuditLoops } from "../blog/pipeline.js";
import { saveBlogToDesktop } from "../blog/save-output.js";
import { BlogWriterRequestSchema, type BlogWriterRequest } from "../blog/types.js";

const router = Router();

// Persist every generated blog to ~/Desktop/shakes-peer/blogs automatically.
// Set SHAKESPEER_SAVE_TO_DESKTOP=false to disable.
function shouldSaveToDesktop(): boolean {
  return process.env.SHAKESPEER_SAVE_TO_DESKTOP !== "false";
}

// Parse the request through Zod so the markdown renderer gets defaulted fields.
// If parsing fails, we let the generator raise the error — no reason to swallow it here.
function parseRequest(body: unknown): BlogWriterRequest | null {
  const parsed = BlogWriterRequestSchema.safeParse(body);
  return parsed.success ? parsed.data : null;
}

router.post("/blog/write", async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await generateBlogPackage(req.body);

    // Auto-save working draft + canonical markdown
    let savedTo: string | undefined;
    let repoMarkdown: string | null | undefined;
    if (shouldSaveToDesktop()) {
      try {
        const parsedRequest = parseRequest(req.body);
        const saved = saveBlogToDesktop(
          result,
          undefined,
          parsedRequest ?? undefined
        );
        savedTo = saved.folder;
        repoMarkdown = saved.repo_markdown;
      } catch (err) {
        console.warn("[blog/write] Failed to save to Desktop:", err);
      }
    }

    res.json({ ...result, saved_to: savedTo, repo_markdown: repoMarkdown });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: "Invalid input",
        details: error.flatten(),
      });
      return;
    }

    res.status(500).json({
      error: "Blog generation failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.post("/blog/audit", async (req: Request, res: Response): Promise<void> => {
  try {
    const result = auditBlogPackage(req.body);
    res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: "Invalid audit input",
        details: error.flatten(),
      });
      return;
    }

    res.status(500).json({
      error: "Blog audit failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.post("/blog/write-and-audit", async (req: Request, res: Response): Promise<void> => {
  try {
    const loops =
      typeof req.body?.improvement_loops === "number" ? req.body.improvement_loops : 2;
    const targetScore =
      typeof req.body?.target_score === "number" ? req.body.target_score : 94;
    const result = await generateBlogPackageWithAuditLoops(req.body, {
      improvement_loops: loops,
      target_score: targetScore,
    });

    // Save to Desktop with audit attached; also write canonical markdown to repo
    let savedTo: string | undefined;
    let repoMarkdown: string | null | undefined;
    if (shouldSaveToDesktop() && (result as any).package) {
      try {
        const parsedRequest = parseRequest(req.body);
        const saved = saveBlogToDesktop(
          (result as any).package,
          (result as any).audit,
          parsedRequest ?? undefined
        );
        savedTo = saved.folder;
        repoMarkdown = saved.repo_markdown;
      } catch (err) {
        console.warn("[blog/write-and-audit] Failed to save to Desktop:", err);
      }
    }

    res.json({ ...result, saved_to: savedTo, repo_markdown: repoMarkdown });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: "Invalid input",
        details: error.flatten(),
      });
      return;
    }

    res.status(500).json({
      error: "Blog write-and-audit failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;

import dotenv from "dotenv";
dotenv.config({ override: true });
import express from "express";
import cors from "cors";
import analyzeRouter from "./routes/analyze.js";
import blogRouter from "./routes/blog.js";

const app = express();
const port = parseInt(process.env.PORT ?? "3000", 10);

app.use(cors());
app.use(express.json());
app.use(analyzeRouter);
app.use(blogRouter);

app.listen(port, () => {
  console.log(`SERP Analyzer running on http://localhost:${port}`);
  console.log(`POST /analyze — run analysis`);
  console.log(`POST /blog/write — generate SEO/AEO blog package`);
  console.log(`POST /blog/audit — audit article/html/json-ld for SEO + AEO readiness`);
  console.log(`POST /blog/write-and-audit — generate and score a blog package in one step`);
  console.log(`GET  /health  — health check`);
});

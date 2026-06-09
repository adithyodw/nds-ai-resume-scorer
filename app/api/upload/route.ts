/* ============================================================
   POST /api/upload — multipart résumé upload
   Accepts one or more PDF / DOCX / ZIP files, parses each,
   scores with the SI engine, persists, and returns results.
   ============================================================ */

import { NextResponse } from "next/server";
import { parseUpload, isSupported } from "@/lib/parse";
import { scoreResume, llmEnabled } from "@/lib/scoring";
import { addCandidates } from "@/lib/store";
import type { Candidate } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB per file (ZIPs can be large)
const MAX_FILES = 200;

interface UploadItemResult {
  fileName: string;
  ok: boolean;
  candidateId?: string;
  name?: string;
  match?: number;
  recommendation?: string;
  error?: string;
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided." }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Too many files in one request (max ${MAX_FILES}).` },
      { status: 413 }
    );
  }

  const roleHint = (form.get("role") as string) || undefined;
  const results: UploadItemResult[] = [];
  const scored: Candidate[] = [];

  for (const file of files) {
    if (!isSupported(file.name)) {
      results.push({ fileName: file.name, ok: false, error: "Unsupported file type (PDF, DOCX, ZIP only)." });
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      results.push({ fileName: file.name, ok: false, error: "File exceeds 25MB limit." });
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const docs = await parseUpload(file.name, buffer);

    for (const doc of docs) {
      if (doc.error || doc.text.trim().length < 40) {
        results.push({
          fileName: doc.fileName,
          ok: false,
          error: doc.error || "Could not extract enough text (scanned image without OCR?).",
        });
        continue;
      }
      try {
        // Skip the LLM step for large batches to keep bulk uploads fast.
        const candidate = await scoreResume(doc.text, doc.fileName, {
          roleHint,
          skipLLM: files.length > 8,
        });
        scored.push(candidate);
        results.push({
          fileName: doc.fileName,
          ok: true,
          candidateId: candidate.id,
          name: candidate.name,
          match: candidate.match,
          recommendation: candidate.recommendation,
        });
      } catch (e) {
        results.push({
          fileName: doc.fileName,
          ok: false,
          error: e instanceof Error ? e.message : "Scoring failed.",
        });
      }
    }
  }

  if (scored.length) await addCandidates(scored);

  return NextResponse.json({
    added: scored,
    results,
    engine: llmEnabled() ? "llm+rules" : "rules",
    summary: {
      processed: results.length,
      scored: scored.length,
      failed: results.filter((r) => !r.ok).length,
    },
  });
}

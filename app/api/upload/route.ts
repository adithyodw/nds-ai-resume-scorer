/* ============================================================
   POST /api/upload — multipart résumé upload
   Accepts one or more PDF / DOCX / ZIP files, parses each,
   scores with the SI engine, persists, and returns results.
   ============================================================ */

import { NextResponse } from "next/server";
import { parseUpload, isSupported, type ParsedDoc } from "@/lib/parse";
import { scoreResume, llmEnabled } from "@/lib/scoring";
import { addCandidates, getStorageInfo, storageMisconfigured } from "@/lib/store";
import type { Candidate } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_BYTES = 25 * 1024 * 1024;
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
  const docs: ParsedDoc[] = [];

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
    docs.push(...(await parseUpload(file.name, buffer)));
  }

  const scored: Candidate[] = [];
  const batch = docs.length > 1;

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
      const candidate = await scoreResume(doc.text, doc.fileName, {
        roleHint,
        skipLLM: batch,
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

  let persisted = 0;
  let storageError: string | null = null;
  const storage = getStorageInfo();

  if (scored.length) {
    try {
      const saved = await addCandidates(scored);
      persisted = saved.length;
    } catch (err) {
      storageError = err instanceof Error ? err.message : "Failed to persist candidates";
      return NextResponse.json(
        {
          error: storageError,
          storage,
          storageWarning: storageMisconfigured() ? "blob_not_configured" : "blob_write_failed",
          added: [],
          results,
          summary: { processed: results.length, scored: 0, failed: results.length },
        },
        { status: 503 }
      );
    }
  }

  return NextResponse.json({
    added: scored,
    results,
    engine: llmEnabled() ? "llm+rules" : "rules",
    storage,
    persisted,
    storageWarning: storageMisconfigured() ? "blob_not_configured" : storageError,
    summary: {
      processed: results.length,
      scored: scored.length,
      failed: results.filter((r) => !r.ok).length,
    },
  });
}

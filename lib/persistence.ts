/* Blob + filesystem persistence for the candidate store. */

import { promises as fs } from "fs";
import path from "path";
import { get, put } from "@vercel/blob";
import type { Candidate } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "candidates.json");
const BLOB_PATHNAME = "nds-talentscore/candidates.json";

export function useBlobStore(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function isVercelRuntime(): boolean {
  return Boolean(process.env.VERCEL);
}

async function readFromFilesystem(): Promise<Candidate[] | null> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Candidate[]) : [];
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return null;
    return [];
  }
}

async function writeToFilesystem(candidates: Candidate[]): Promise<boolean> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(candidates, null, 2), "utf8");
    return true;
  } catch {
    return false;
  }
}

async function readFromBlob(): Promise<Candidate[] | null> {
  try {
    const result = await get(BLOB_PATHNAME, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    const text = await new Response(result.stream).text();
    const parsed = JSON.parse(text) as unknown;
    return Array.isArray(parsed) ? (parsed as Candidate[]) : [];
  } catch {
    return null;
  }
}

async function writeToBlob(candidates: Candidate[]): Promise<void> {
  await put(BLOB_PATHNAME, JSON.stringify(candidates), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

/** Load candidates from the active backend (blob on Vercel, file locally). */
export async function loadCandidates(): Promise<Candidate[]> {
  if (useBlobStore()) {
    const fromBlob = await readFromBlob();
    if (fromBlob !== null) return fromBlob;
    return [];
  }

  const fromFile = await readFromFilesystem();
  if (fromFile !== null) return fromFile;
  return [];
}

/** Persist candidates to every configured backend. */
export async function saveCandidates(candidates: Candidate[]): Promise<void> {
  if (useBlobStore()) {
    await writeToBlob(candidates);
  }
  await writeToFilesystem(candidates);
}

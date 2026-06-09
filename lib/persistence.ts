/* Blob + filesystem persistence for the candidate store. */

import { promises as fs } from "fs";
import path from "path";
import { get, head, put } from "@vercel/blob";
import type { Candidate } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "candidates.json");
const BLOB_PATHNAME = "nds-talentscore/candidates.json";

export function isVercelRuntime(): boolean {
  return Boolean(process.env.VERCEL);
}

function resolveBlobToken(): string | undefined {
  const direct = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (direct) return direct;
  for (const [key, value] of Object.entries(process.env)) {
    if (/_BLOB_READ_WRITE_TOKEN$/i.test(key) && value?.trim()) return value.trim();
  }
  return undefined;
}

/** True when Vercel Blob credentials are available (token and/or store id + OIDC). */
export function hasBlobCredentials(): boolean {
  if (resolveBlobToken()) return true;
  if (process.env.BLOB_STORE_ID?.trim()) return true;
  return false;
}

/** Use Blob whenever credentials exist, or on Vercel (fail loudly if missing). */
export function useBlobStore(): boolean {
  if (hasBlobCredentials()) return true;
  return isVercelRuntime();
}

export function storageMode(): "blob" | "local" {
  return useBlobStore() ? "blob" : "local";
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

function parseCandidateList(text: string): Candidate[] {
  const parsed = JSON.parse(text) as unknown;
  return Array.isArray(parsed) ? (parsed as Candidate[]) : [];
}

async function readFromBlob(): Promise<Candidate[] | null> {
  // Public read (matches write access below).
  try {
    const result = await get(BLOB_PATHNAME, { access: "public", useCache: false });
    if (result?.statusCode === 200 && result.stream) {
      const text = await new Response(result.stream).text();
      return parseCandidateList(text);
    }
  } catch {
    /* fall through */
  }

  // Metadata + URL fetch fallback.
  try {
    const meta = await head(BLOB_PATHNAME);
    const res = await fetch(meta.url, { cache: "no-store" });
    if (res.ok) return parseCandidateList(await res.text());
  } catch {
    /* not found */
  }

  return null;
}

async function writeToBlob(candidates: Candidate[]): Promise<string> {
  const payload = JSON.stringify(candidates);
  const token = resolveBlobToken();
  const result = await put(BLOB_PATHNAME, payload, {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    ...(token ? { token } : {}),
  });

  if (!result?.url) {
    throw new Error("Vercel Blob put succeeded but returned no URL");
  }
  return result.url;
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
    return;
  }
  await writeToFilesystem(candidates);
}

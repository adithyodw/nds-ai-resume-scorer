/* ============================================================
   NDS TalentScore — candidate store
   Persists to Vercel Blob in production (survives serverless).
   Falls back to .data/candidates.json for local development.
   ============================================================ */

import type { Candidate, CandidateStatus } from "./types";
import { SEED_CANDIDATES } from "./seed";
import {
  isVercelRuntime,
  loadCandidates as readStore,
  saveCandidates,
  useBlobStore,
} from "./persistence";

// Local filesystem cache only — never used when Blob is active.
let fileCache: Candidate[] | null = null;

async function load(): Promise<Candidate[]> {
  if (useBlobStore()) {
    return readStore();
  }

  if (fileCache) return fileCache;

  const stored = await readStore();
  if (stored.length > 0) {
    fileCache = stored;
    return fileCache;
  }

  // First local run: optional demo seed (never on Vercel).
  if (!isVercelRuntime() && process.env.NODE_ENV === "development") {
    fileCache = SEED_CANDIDATES.map((c) => ({ ...c }));
    await saveCandidates(fileCache);
    return fileCache;
  }

  fileCache = [];
  return fileCache;
}

async function persist(next: Candidate[]): Promise<void> {
  if (!useBlobStore()) {
    fileCache = next;
  }
  await saveCandidates(next);
}

export async function listCandidates(): Promise<Candidate[]> {
  return [...(await load())];
}

export async function getCandidate(id: string): Promise<Candidate | undefined> {
  return (await load()).find((c) => c.id === id);
}

/** Insert new candidates at the top of the pipeline; returns the updated list. */
export async function addCandidates(incoming: Candidate[]): Promise<Candidate[]> {
  const list = await load();
  const existingIds = new Set(list.map((c) => c.id));
  const fresh = incoming.filter((c) => !existingIds.has(c.id));
  const next = [...fresh, ...list];
  await persist(next);
  return [...next];
}

function withStatus(c: Candidate, status: CandidateStatus): Candidate {
  const now = new Date().toISOString();
  const patch: Candidate = { ...c, status };
  if (status === "shortlisted" && !c.shortlistedAt) {
    patch.shortlistedAt = now;
  }
  return patch;
}

export async function setStatus(
  id: string,
  status: CandidateStatus
): Promise<Candidate | undefined> {
  const list = await load();
  const next = list.map((c) => (c.id === id ? withStatus(c, status) : c));
  await persist(next);
  return next.find((c) => c.id === id);
}

/** Mark shortlisted (if needed) and set interview scheduled timestamp. */
export async function scheduleCandidate(id: string): Promise<Candidate | undefined> {
  const list = await load();
  const now = new Date().toISOString();
  const next = list.map((c) => {
    if (c.id !== id) return c;
    return {
      ...c,
      status: "shortlisted" as CandidateStatus,
      shortlistedAt: c.shortlistedAt ?? now,
      scheduledAt: now,
    };
  });
  await persist(next);
  return next.find((c) => c.id === id);
}

export async function removeCandidate(id: string): Promise<void> {
  const list = await load();
  await persist(list.filter((c) => c.id !== id));
}

/** Remove multiple candidates by id; returns how many were deleted. */
export async function removeCandidates(ids: string[]): Promise<number> {
  if (!ids.length) return 0;
  const drop = new Set(ids);
  const list = await load();
  const next = list.filter((c) => !drop.has(c.id));
  const removed = list.length - next.length;
  await persist(next);
  return removed;
}

/** True when running on Vercel without durable storage configured. */
export function storageMisconfigured(): boolean {
  return isVercelRuntime() && !useBlobStore();
}

/** Restore candidates only when the server store is empty (client cache recovery). */
export async function restoreIfEmpty(incoming: Candidate[]): Promise<Candidate[]> {
  if (!incoming.length) return listCandidates();
  const existing = await load();
  if (existing.length > 0) return existing;
  await persist(incoming);
  return [...incoming];
}

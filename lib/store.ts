/* ============================================================
   NDS TalentScore — candidate store
   Dependency-free persistence: a JSON file under .data/ with an
   in-memory cache. Seeded on first run. Swap this module for a
   Postgres/Prisma repository later without touching callers.
   ============================================================ */

import { promises as fs } from "fs";
import path from "path";
import type { Candidate, CandidateStatus } from "./types";
import { SEED_CANDIDATES } from "./seed";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "candidates.json");

// Module-level cache survives across requests in a single server process.
let cache: Candidate[] | null = null;
let writable = true;

async function load(): Promise<Candidate[]> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    cache = JSON.parse(raw) as Candidate[];
  } catch {
    cache = SEED_CANDIDATES.map((c) => ({ ...c }));
    await persist();
  }
  return cache;
}

async function persist(): Promise<void> {
  if (!writable || !cache) return;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(cache, null, 2), "utf8");
  } catch {
    // read-only FS (e.g. serverless) — keep working from the in-memory cache.
    writable = false;
  }
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
  cache = [...fresh, ...list];
  await persist();
  return [...cache];
}

export async function setStatus(
  id: string,
  status: CandidateStatus
): Promise<Candidate | undefined> {
  const list = await load();
  const next = list.map((c) => (c.id === id ? { ...c, status } : c));
  cache = next;
  await persist();
  return next.find((c) => c.id === id);
}

export async function removeCandidate(id: string): Promise<void> {
  const list = await load();
  cache = list.filter((c) => c.id !== id);
  await persist();
}

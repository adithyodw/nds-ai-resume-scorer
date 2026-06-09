import type { Candidate } from "./types";

const KEY = "nds-talentscore-candidates";

export function readClientCache(): Candidate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Candidate[]) : [];
  } catch {
    return [];
  }
}

export function writeClientCache(candidates: Candidate[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(candidates));
  } catch {
    /* quota exceeded — ignore */
  }
}

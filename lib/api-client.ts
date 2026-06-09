import type { Candidate, CandidateStatus } from "./types";

export async function fetchCandidates(): Promise<Candidate[]> {
  const res = await fetch("/api/candidates");
  if (!res.ok) throw new Error("Failed to load candidates");
  const data = await res.json();
  return data.candidates as Candidate[];
}

export async function updateCandidateStatus(
  id: string,
  status: CandidateStatus
): Promise<Candidate> {
  const res = await fetch(`/api/candidates/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update status");
  const data = await res.json();
  return data.candidate as Candidate;
}

export interface UploadResult {
  added: Candidate[];
  results: { fileName: string; ok: boolean; error?: string }[];
  engine: string;
  summary: { processed: number; scored: number; failed: number };
}

export async function uploadResumes(files: File[], role?: string): Promise<UploadResult> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  if (role) form.append("role", role);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Upload failed");
  }
  return res.json();
}

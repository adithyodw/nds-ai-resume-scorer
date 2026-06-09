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

export async function scheduleCandidateInterview(id: string): Promise<Candidate> {
  const res = await fetch(`/api/candidates/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ schedule: true }),
  });
  if (!res.ok) throw new Error("Failed to schedule interview");
  const data = await res.json();
  return data.candidate as Candidate;
}

export async function notifyWhatsApp(
  candidateId: string,
  origin: string
): Promise<{ waUrl: string; sent: boolean }> {
  const res = await fetch("/api/notify/whatsapp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidateId, origin }),
  });
  if (!res.ok) throw new Error("Failed to send WhatsApp notification");
  const data = await res.json();
  return { waUrl: data.waUrl as string, sent: Boolean(data.sent) };
}

export interface UploadResult {
  added: Candidate[];
  results: { fileName: string; ok: boolean; error?: string }[];
  engine: string;
  summary: { processed: number; scored: number; failed: number };
}

export async function deleteCandidates(ids: string[]): Promise<number> {
  const res = await fetch("/api/candidates", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete candidates");
  }
  const data = await res.json();
  return data.removed as number;
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

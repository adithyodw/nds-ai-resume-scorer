/* Live dashboard stats derived from the current candidate store. */

import type { Candidate } from "./types";
import type { CertHeat, FunnelStage, RoleDemand } from "./types";

export function avgMatch(candidates: Candidate[]): number {
  if (!candidates.length) return 0;
  return Math.round(candidates.reduce((s, c) => s + c.match, 0) / candidates.length);
}

export function computeFunnel(candidates: Candidate[]): FunnelStage[] {
  const total = candidates.length;
  if (!total) {
    return [
      { stage: "Uploaded", value: 0 },
      { stage: "AI Screened", value: 0 },
      { stage: "Shortlisted", value: 0 },
      { stage: "In Review", value: 0 },
      { stage: "Rejected", value: 0 },
    ];
  }
  const shortlisted = candidates.filter((c) => c.status === "shortlisted").length;
  const review = candidates.filter((c) => c.status === "review").length;
  const rejected = candidates.filter((c) => c.status === "rejected").length;
  const newCount = candidates.filter((c) => c.status === "new").length;
  return [
    { stage: "Uploaded", value: total },
    { stage: "AI Screened", value: total },
    { stage: "New", value: newCount },
    { stage: "Shortlisted", value: shortlisted },
    { stage: "In Review", value: review },
    { stage: "Rejected", value: rejected },
  ];
}

export function computeRoleDemand(candidates: Candidate[]): RoleDemand[] {
  const byRole: Record<string, { count: number; sumMatch: number }> = {};
  for (const c of candidates) {
    if (!byRole[c.role]) byRole[c.role] = { count: 0, sumMatch: 0 };
    byRole[c.role].count += 1;
    byRole[c.role].sumMatch += c.match;
  }
  return Object.entries(byRole)
    .map(([role, { count, sumMatch }]) => ({
      role: role.replace("Engineer", "Eng."),
      open: 0,
      candidates: count,
      avg: Math.round(sumMatch / count),
    }))
    .sort((a, b) => b.candidates - a.candidates);
}

export function computeCertHeat(candidates: Candidate[]): CertHeat[] {
  const counts: Record<string, number> = {};
  for (const c of candidates) {
    for (const cert of c.certs) {
      counts[cert.name] = (counts[cert.name] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([cert, count]) => ({ cert, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

export function uniqueRoles(candidates: Candidate[]): number {
  return new Set(candidates.map((c) => c.role)).size;
}

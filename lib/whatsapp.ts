import type { Candidate } from "./types";
import { NDS } from "./nds-data";

/** Adit's WhatsApp (Singapore +65). */
export const NOTIFY_PHONE = "6590616870";

export function candidateReportUrl(origin: string, id: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/?candidate=${encodeURIComponent(id)}`;
}

export function buildShortlistScheduleMessage(c: Candidate, origin: string): string {
  const rec = NDS.REC[c.recommendation]?.label ?? c.recommendation;
  const certs = c.certs.map((x) => x.name).join(", ") || "—";
  const url = candidateReportUrl(origin, c.id);

  return [
    "*NDS TalentScore — Candidate Shortlisted & Scheduled*",
    "",
    `*Name:* ${c.name}`,
    `*Role:* ${c.role}`,
    `*Match:* ${c.match}% | ${rec}`,
    `*Experience:* ${c.experience} years`,
    `*Location:* ${c.location}`,
    `*Certs:* ${certs}`,
    `*Notice:* ${c.noticeDays} days`,
    "",
    `*Report:* ${url}`,
    "",
    "Shortlisted by Mba Icha (HR Lead · NDS)",
  ].join("\n");
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

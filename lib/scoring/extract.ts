/* ============================================================
   NDS TalentScore — résumé feature extraction
   Pulls structured signals out of raw résumé text. Used as the
   input to both the rule-based engine and (optionally) the LLM.
   ============================================================ */

import {
  SKILL_TAXONOMY,
  CERT_WEIGHTS,
  RADAR_AXES,
  ENTERPRISE_KEYWORDS,
  ACHIEVEMENT_WORDS,
} from "../rubrics";
import { detectYearsOfExperience } from "./experience";

export interface ExtractedCert {
  name: string;
  level: string;
  active: boolean;
  weight: number;
  family: string;
}

export interface ResumeFeatures {
  name: string;
  initials: string;
  title: string;
  email?: string;
  phone?: string;
  location: string;
  years: number;
  /** matched canonical skill phrases (display-ready) */
  skills: string[];
  /** matched-skill count per radar axis */
  axisHits: Record<(typeof RADAR_AXES)[number], number>;
  certs: ExtractedCert[];
  enterpriseHits: number;
  achievementHits: number;
  /** detected résumé sections (experience/education/skills/...) */
  sections: string[];
  wordCount: number;
  rawText: string;
}

const CITY_HINTS = [
  "Jakarta", "Bandung", "Surabaya", "Tangerang", "Semarang", "Bekasi", "Depok",
  "Medan", "Makassar", "Yogyakarta", "Bali", "Denpasar", "Bogor", "Batam",
  "Singapore", "Kuala Lumpur", "Manila", "Bangkok", "Ho Chi Minh",
];

const TITLE_HINTS = [
  "engineer", "consultant", "architect", "analyst", "manager", "lead",
  "specialist", "administrator", "officer", "executive", "developer",
];

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "NA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function titleCaseFromFile(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "");
  const cleaned = base
    .replace(/\b(cv|resume|résumé|curriculum vitae|final|updated?|\d{4})\b/gi, " ")
    .replace(/[_\-.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

/** Best-effort name detection from résumé text, falling back to the file name. */
function detectName(lines: string[], fileName: string): string {
  for (const raw of lines.slice(0, 8)) {
    const line = raw.trim();
    if (!line || line.length > 42) continue;
    if (/@|http|www\.|\d{4,}|curriculum|resume|résumé/i.test(line)) continue;
    const words = line.split(/\s+/);
    if (words.length < 2 || words.length > 4) continue;
    // mostly capitalised words → likely a name
    const capRatio =
      words.filter((w) => /^[A-Z][a-zA-Z'’.-]+$/.test(w)).length / words.length;
    if (capRatio >= 0.6) return line.replace(/[.,]+$/, "");
  }
  const fromFile = titleCaseFromFile(fileName);
  return fromFile || "Unnamed Candidate";
}

function detectLocation(text: string): string {
  for (const city of CITY_HINTS) {
    if (new RegExp(`\\b${city}\\b`, "i").test(text)) {
      const intl = ["Singapore", "Kuala Lumpur", "Manila", "Bangkok", "Ho Chi Minh"].includes(city);
      return intl ? city : `${city}, ID`;
    }
  }
  return "Indonesia";
}

function detectTitle(lines: string[], skills: string[]): string {
  for (const raw of lines.slice(0, 12)) {
    const line = raw.trim();
    if (line.length < 6 || line.length > 48) continue;
    if (TITLE_HINTS.some((h) => line.toLowerCase().includes(h))) {
      return line.replace(/[.,|]+$/, "").trim();
    }
  }
  // derive from dominant skill area
  if (skills.some((s) => /firewall|fortinet|palo alto|security/i.test(s)))
    return "Network Security Engineer";
  if (skills.some((s) => /aws|azure|kubernetes|cloud/i.test(s)))
    return "Cloud Engineer";
  return "Network Engineer";
}

function countMatches(text: string, needle: string): boolean {
  // word-ish boundary match, case-insensitive, escaped
  const esc = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`, "i").test(text);
}

function detectCerts(text: string): ExtractedCert[] {
  const lower = text.toLowerCase();
  const found: ExtractedCert[] = [];
  const seen = new Set<string>();
  for (const [key, meta] of Object.entries(CERT_WEIGHTS)) {
    if (!countMatches(lower, key)) continue;
    const canonical = key.toUpperCase();
    if (seen.has(meta.family + canonical)) continue;
    seen.add(meta.family + canonical);
    // expiry heuristic: "expired" / "lapsed" within ~40 chars of the cert mention
    const idx = lower.indexOf(key);
    const window = lower.slice(Math.max(0, idx - 40), idx + key.length + 40);
    const active = !/\b(expired|lapsed|not\s+renewed)\b/.test(window);
    found.push({
      name: canonical.replace(/\bAWS SOLUTIONS ARCHITECT PRO\b/, "AWS Solutions Architect Pro"),
      level: meta.level,
      active,
      weight: meta.weight,
      family: meta.family,
    });
  }
  return found.sort((a, b) => b.weight - a.weight).slice(0, 8);
}

function detectSkills(text: string): {
  skills: string[];
  axisHits: Record<(typeof RADAR_AXES)[number], number>;
} {
  const axisHits = Object.fromEntries(RADAR_AXES.map((a) => [a, 0])) as Record<
    (typeof RADAR_AXES)[number],
    number
  >;
  const display = new Map<string, string>();
  for (const axis of RADAR_AXES) {
    for (const term of SKILL_TAXONOMY[axis]) {
      if (countMatches(text, term)) {
        axisHits[axis] += 1;
        const label = term
          .split(/\s+/)
          .map((w) => (w.length <= 4 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
          .join(" ");
        if (!display.has(term.toLowerCase())) display.set(term.toLowerCase(), label);
      }
    }
  }
  return { skills: Array.from(display.values()).slice(0, 16), axisHits };
}

function detectSections(text: string): string[] {
  const lower = text.toLowerCase();
  const sections: string[] = [];
  const map: Record<string, RegExp> = {
    experience: /\b(work experience|professional experience|experience|employment)\b/,
    education: /\b(education|academic|university|bachelor|degree)\b/,
    skills: /\b(skills|technical skills|competencies)\b/,
    certifications: /\b(certifications?|licenses?)\b/,
    summary: /\b(summary|profile|objective|about me)\b/,
    projects: /\b(projects?|portfolio)\b/,
  };
  for (const [name, re] of Object.entries(map)) if (re.test(lower)) sections.push(name);
  return sections;
}

export function extractFeatures(rawText: string, fileName: string): ResumeFeatures {
  const text = rawText.replace(/\r/g, "").replace(/ /g, " ");
  const lines = text.split("\n").map((l) => l.trim());
  const name = detectName(lines, fileName);

  const { skills, axisHits } = detectSkills(text);
  const certs = detectCerts(text);
  const years = detectYearsOfExperience(text);
  const lower = text.toLowerCase();

  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0];
  const phone = text.match(/(\+?\d[\d\s().-]{7,}\d)/)?.[0];

  const enterpriseHits = ENTERPRISE_KEYWORDS.filter((k) => countMatches(lower, k)).length;
  const achievementHits = ACHIEVEMENT_WORDS.filter((k) =>
    k === "%" ? text.includes("%") : countMatches(lower, k)
  ).length;

  const words = text.split(/\s+/).filter(Boolean);

  return {
    name,
    initials: initialsOf(name),
    title: detectTitle(lines, skills),
    email,
    phone,
    location: detectLocation(text),
    years,
    skills,
    axisHits,
    certs,
    enterpriseHits,
    achievementHits,
    sections: detectSections(text),
    wordCount: words.length,
    rawText: text,
  };
}

/* ============================================================
   NDS TalentScore — rule-based scoring engine
   Deterministic SI scoring model. No API key required.
   Turns ResumeFeatures into a fully-scored Candidate.
   ============================================================ */

import type {
  Candidate,
  Recommendation,
  ScoreBreakdown,
  ImprovementSuggestion,
  Seniority,
} from "../types";
import {
  RADAR_AXES,
  ROLES,
  ROLE_FOCUS,
  SCORE_WEIGHTS,
  seniorityFor,
} from "../rubrics";
import type { ResumeFeatures } from "./extract";

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

/** Saturating curve: maps a raw hit count to a 0–100 sub-score. */
function saturate(hits: number, perPoint: number, base = 0): number {
  return clamp(base + (1 - Math.exp(-hits / perPoint)) * (100 - base));
}

/** Pick the best-fit role from the catalog given the axis hit profile. */
function pickRole(f: ResumeFeatures): string {
  let best = "Network Engineer";
  let bestScore = -1;
  for (const role of ROLES) {
    const focus = ROLE_FOCUS[role];
    if (!focus) continue;
    let score = 0;
    focus.forEach((axis, i) => {
      score += (f.axisHits[axis] || 0) * (focus.length - i);
    });
    // leadership roles need seniority
    if (/Lead|Manager/.test(role) && f.years < 7) score *= 0.4;
    if (score > bestScore) {
      bestScore = score;
      best = role;
    }
  }
  return best;
}

function radarFor(f: ResumeFeatures): number[] {
  // base axis scores from skill coverage
  const base = RADAR_AXES.map((axis) => {
    const hits = f.axisHits[axis] || 0;
    return saturate(hits, 2.5, 8);
  });
  // experience lifts Leadership & Routing baselines a touch
  const expLift = Math.min(18, f.years * 1.5);
  const idxLead = RADAR_AXES.indexOf("Leadership");
  const idxPre = RADAR_AXES.indexOf("Presales / Client");
  base[idxLead] = clamp(base[idxLead] + (f.years >= 8 ? expLift : expLift * 0.4));
  base[idxPre] = clamp(base[idxPre] + (f.achievementHits >= 4 ? 6 : 0));
  return base.map((v) => clamp(v));
}

function scoreDimensions(f: ResumeFeatures, radar: number[]): ScoreBreakdown {
  const idx = (a: (typeof RADAR_AXES)[number]) => radar[RADAR_AXES.indexOf(a)];

  // technical: routing + security + cloud + automation, weighted
  const technical = clamp(
    idx("Routing & Switching") * 0.3 +
      idx("Network Security") * 0.3 +
      idx("Cloud & Data Center") * 0.22 +
      idx("Automation") * 0.18
  );

  // certification: weighted, expired certs heavily discounted
  const certScoreRaw = f.certs.reduce(
    (acc, c) => acc + c.weight * (c.active ? 1 : 0.35),
    0
  );
  const certification = clamp(saturate(certScoreRaw, 140, 12));

  // experience: years + enterprise/SI exposure
  const experience = clamp(
    saturate(f.years, 6, 20) * 0.7 + saturate(f.enterpriseHits, 4, 10) * 0.3
  );

  // communication & leadership
  const communication = clamp(
    idx("Presales / Client") * 0.55 +
      idx("Leadership") * 0.3 +
      saturate(f.achievementHits, 5, 10) * 0.15
  );

  // résumé quality: sections present, achievement wording, sane length, contact
  const sectionScore = (f.sections.length / 6) * 100;
  const lengthScore =
    f.wordCount >= 250 && f.wordCount <= 1400 ? 100 : f.wordCount < 250 ? 55 : 78;
  const contactScore = (f.email ? 60 : 0) + (f.phone ? 40 : 0);
  const quality = clamp(
    sectionScore * 0.4 +
      saturate(f.achievementHits, 5, 20) * 0.3 +
      lengthScore * 0.2 +
      contactScore * 0.1
  );

  return { technical, certification, experience, communication, quality };
}

function overallMatch(s: ScoreBreakdown): number {
  return clamp(
    s.technical * SCORE_WEIGHTS.technical +
      s.experience * SCORE_WEIGHTS.experience +
      s.certification * SCORE_WEIGHTS.certification +
      s.communication * SCORE_WEIGHTS.communication +
      s.quality * SCORE_WEIGHTS.quality
  );
}

function recommendationFor(match: number, f: ResumeFeatures, s: ScoreBreakdown): Recommendation {
  const expiredCount = f.certs.filter((c) => !c.active).length;
  let m = match;
  if (s.communication < 60) m -= 4;
  if (s.quality < 55) m -= 4;
  if (expiredCount >= 2) m -= 5;
  if (m >= 90) return "STRONG";
  if (m >= 82) return "HIRE";
  if (m >= 70) return "CONSIDER";
  if (m >= 60) return "WEAK";
  return "REJECT";
}

function confidenceFor(f: ResumeFeatures): number {
  // more extractable signal → higher confidence
  const signal =
    f.skills.length * 2 +
    f.certs.length * 4 +
    f.sections.length * 5 +
    (f.email ? 6 : 0) +
    Math.min(20, f.wordCount / 30);
  return clamp(55 + signal, 55, 98);
}

function salaryBandFor(
  years: number,
  seniority: Seniority,
  location: string
): { band: string; expect: number } {
  const loc = location.toLowerCase();

  if (loc.includes("singapore")) {
    const table: Record<Seniority, [number, number]> = {
      Junior: [3500, 5500],
      Mid: [5500, 8000],
      "Mid-Senior": [7500, 10500],
      Senior: [9000, 13000],
      Lead: [11000, 16000],
      Manager: [14000, 22000],
    };
    const [lo, hi] = table[seniority];
    const expect = Math.round((lo + hi) / 2);
    return {
      band: `S$${Math.round(lo / 100) / 10}–${Math.round(hi / 100) / 10}k/mo`,
      expect,
    };
  }

  const table: Record<Seniority, [number, number]> = {
    Junior: [8, 14],
    Mid: [14, 22],
    "Mid-Senior": [20, 30],
    Senior: [26, 40],
    Lead: [36, 52],
    Manager: [45, 65],
  };
  let [lo, hi] = table[seniority];
  const adj = Math.max(-4, Math.min(4, Math.round((years - 6) * 0.6)));
  lo = Math.max(6, lo + adj);
  hi = Math.max(lo + 3, hi + adj);
  const expect = Math.round((lo + hi) / 2);
  return { band: `${lo}–${hi} jt/mo`, expect };
}

function buildNarrative(
  f: ResumeFeatures,
  role: string,
  s: ScoreBreakdown,
  rec: Recommendation
): { highlights: string[]; gaps: string[]; summary: string; suggestions: ImprovementSuggestion[] } {
  const highlights: string[] = [];
  const gaps: string[] = [];
  const suggestions: ImprovementSuggestion[] = [];

  const topCert = f.certs.find((c) => c.active);
  if (topCert) highlights.push(`Holds ${topCert.name} (${topCert.level}) plus ${Math.max(0, f.certs.length - 1)} further certifications.`);
  if (f.years >= 8) highlights.push(`${f.years} years of hands-on experience with strong enterprise exposure.`);
  else if (f.years >= 4) highlights.push(`${f.years} years of relevant engineering experience.`);
  if (s.technical >= 80) highlights.push(`Deep technical coverage across ${f.skills.slice(0, 4).join(", ")}.`);
  if (s.communication >= 80) highlights.push("Strong client-facing / presales and leadership signals.");
  if (f.enterpriseHits >= 4) highlights.push("Evidence of enterprise / managed-services and regional project delivery.");
  if (highlights.length === 0) highlights.push("Foundational skill set suitable for junior or field roles.");

  const expired = f.certs.filter((c) => !c.active);
  if (expired.length) gaps.push(`${expired.length} expired certification${expired.length > 1 ? "s" : ""} (${expired.map((c) => c.name).join(", ")}) reduce the certification score.`);
  if (s.certification < 65) gaps.push("Certification ladder is light for the target role.");
  if (s.communication < 65) gaps.push("Limited presales / client-facing or leadership signals in the résumé.");
  if (s.quality < 65) gaps.push("Résumé structure / ATS readiness is below the hiring bar.");
  if (f.axisHits["Cloud & Data Center"] < 2) gaps.push("Limited public-cloud / data-center exposure.");
  if (gaps.length === 0) gaps.push("No material gaps detected for the matched role.");

  // improvement suggestions
  if (!f.certs.some((c) => /cissp/i.test(c.name)) && /Security/.test(role))
    suggestions.push({ type: "cert", text: "Pursue CISSP — the highest-weighted missing certification for senior security roles; would lift the Certification score noticeably." });
  if (f.axisHits["Cloud & Data Center"] < 2)
    suggestions.push({ type: "kw", text: "Surface cloud security / data-center keywords (CSPM, CNAPP, Prisma Cloud, VMware) — currently thin and increasingly required." });
  if (f.achievementHits < 4)
    suggestions.push({ type: "word", text: 'Reframe task-based bullets into achievement-based wording (e.g. "reduced incident MTTR by 42%") to improve résumé quality and ATS ranking.' });
  if (f.axisHits["Network Security"] < 3 && /Security/.test(role))
    suggestions.push({ type: "add", text: "Add a quantified enterprise firewall-migration project (site count, downtime, vendor) to strengthen the security profile." });
  if (suggestions.length === 0)
    suggestions.push({ type: "word", text: "Quantify more outcomes with metrics to keep strengthening the profile." });

  const recLabel: Record<Recommendation, string> = {
    STRONG: "an excellent",
    HIRE: "a strong",
    CONSIDER: "a worth-considering",
    WEAK: "a marginal",
    REJECT: "a below-bar",
  };
  const summary = `${recLabel[rec]} match for ${role}. ${highlights[0]} ${gaps[0]}`;

  return { highlights: highlights.slice(0, 4), gaps: gaps.slice(0, 4), summary, suggestions: suggestions.slice(0, 4) };
}

/**
 * Score a candidate from extracted features using the deterministic engine.
 * @param roleHint optional target role; otherwise inferred.
 */
export function scoreFromFeatures(
  f: ResumeFeatures,
  opts: { id: string; sourceFile?: string; roleHint?: string }
): Candidate {
  const role = opts.roleHint && ROLES.includes(opts.roleHint as (typeof ROLES)[number])
    ? opts.roleHint
    : pickRole(f);
  const radar = radarFor(f);
  const scores = scoreDimensions(f, radar);
  const match = overallMatch(scores);
  const rec = recommendationFor(match, f, scores);
  const seniority = seniorityFor(f.years);
  const { band, expect } = salaryBandFor(f.years, seniority, f.location);
  const { highlights, gaps, summary, suggestions } = buildNarrative(f, role, scores, rec);

  return {
    id: opts.id,
    name: f.name,
    initials: f.initials,
    title: f.title,
    role,
    location: f.location,
    experience: f.years,
    noticeDays: 30,
    salaryExpect: expect,
    status: "new",
    appliedAgo: "now",
    match,
    recommendation: rec,
    confidence: confidenceFor(f),
    seniority,
    salaryBand: band,
    scores,
    radar,
    certs: f.certs.map((c) => ({ name: c.name, level: c.level, active: c.active })),
    skills: f.skills,
    highlights,
    gaps,
    summary,
    suggestions,
    isNew: true,
    sourceFile: opts.sourceFile,
    createdAt: new Date().toISOString(),
  };
}

/* ============================================================
   NDS TalentScore — shared domain types
   The Candidate shape mirrors the design prototype 1:1 so the
   UI ported from design-reference renders unchanged.
   ============================================================ */

export type Recommendation = "STRONG" | "HIRE" | "CONSIDER" | "WEAK" | "REJECT";

export type CandidateStatus = "new" | "review" | "shortlisted" | "rejected";

export type Seniority =
  | "Junior"
  | "Mid"
  | "Mid-Senior"
  | "Senior"
  | "Lead"
  | "Manager";

/** The five weighted scoring dimensions (0–100 each). */
export interface ScoreBreakdown {
  technical: number;
  certification: number;
  experience: number;
  communication: number;
  quality: number;
}

export interface Certification {
  name: string;
  /** e.g. Associate / Professional / Expert / Foundation */
  level: string;
  /** false === expired (rendered greyed-out + score penalty) */
  active: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  initials: string;
  title: string;
  /** Best-fit SI role from the role catalog. */
  role: string;
  location: string;
  experience: number; // years
  noticeDays: number;
  salaryExpect: number; // IDR juta / month
  status: CandidateStatus;
  appliedAgo: string;
  match: number; // overall AI match 0–100
  recommendation: Recommendation;
  confidence: number; // 0–100
  seniority: Seniority;
  salaryBand: string;
  scores: ScoreBreakdown;
  /** 6 values aligned to RADAR_AXES order. */
  radar: number[];
  certs: Certification[];
  skills: string[];
  highlights: string[];
  gaps: string[];
  summary: string;
  /** AI improvement suggestions surfaced on the report. */
  suggestions?: ImprovementSuggestion[];
  isNew?: boolean;
  /** Original uploaded file name, when created via upload. */
  sourceFile?: string;
  /** ISO timestamp the candidate was created/scored. */
  createdAt?: string;
  /** ISO timestamp when HR moved candidate to shortlist. */
  shortlistedAt?: string;
  /** ISO timestamp when an interview was scheduled. */
  scheduledAt?: string;
}

export type SuggestionType = "add" | "cert" | "kw" | "word";

export interface ImprovementSuggestion {
  type: SuggestionType;
  text: string;
}

/* ---- analytics / dashboard aggregate shapes ---- */
export interface FunnelStage {
  stage: string;
  value: number;
}
export interface RoleDemand {
  role: string;
  open: number;
  candidates: number;
  avg: number;
}
export interface CertHeat {
  cert: string;
  count: number;
}
export interface Kpis {
  candidates: number;
  shortlisted: number;
  avgScore: number;
  timeToShortlist: number;
  openRoles: number;
  aiProcessed: number;
}

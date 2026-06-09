/* Total professional experience from résumé text — employment spans only. */

const MONTH_MAP: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function monthIndex(year: number, month: number): number {
  return year * 12 + month;
}

function parseEndToken(
  monthToken: string | undefined,
  yearToken: string,
  nowY: number,
  nowM: number
): number | null {
  const y = yearToken.toLowerCase();
  if (/present|current|now|sekarang|hingga/i.test(y)) {
    return monthIndex(nowY, nowM);
  }
  const year = parseInt(yearToken, 10);
  if (!Number.isFinite(year) || year < 1985 || year > nowY + 1) return null;
  const m = monthToken ? MONTH_MAP[monthToken.toLowerCase().slice(0, 3)] ?? 12 : 12;
  return monthIndex(year, m);
}

function extractExperienceSection(text: string): string {
  const lower = text.toLowerCase();
  const starts = [
    "work experience",
    "professional experience",
    "employment history",
    "career history",
    "work history",
    "pengalaman kerja",
    "riwayat pekerjaan",
    "experience",
  ];
  const ends = [
    "education",
    "academic",
    "certification",
    "skills",
    "projects",
    "references",
    "pendidikan",
    "sertifikasi",
    "keahlian",
  ];

  let startIdx = -1;
  for (const s of starts) {
    const i = lower.search(new RegExp(`\\b${s}\\b`, "i"));
    if (i >= 0 && (startIdx < 0 || i < startIdx)) startIdx = i;
  }
  if (startIdx < 0) return text;

  let endIdx = lower.length;
  for (const e of ends) {
    const i = lower.indexOf(e, startIdx + 10);
    if (i > startIdx && i < endIdx) endIdx = i;
  }
  return text.slice(startIdx, endIdx);
}

function mergeSpanMonths(spans: { start: number; end: number }[]): number {
  if (!spans.length) return 0;
  spans.sort((a, b) => a.start - b.start);
  let total = 0;
  let cur = { ...spans[0] };
  for (let i = 1; i < spans.length; i++) {
    const s = spans[i];
    if (s.start <= cur.end + 1) {
      cur.end = Math.max(cur.end, s.end);
    } else {
      total += cur.end - cur.start;
      cur = { ...s };
    }
  }
  total += cur.end - cur.start;
  return total;
}

function sumEmploymentMonths(text: string): number {
  const section = extractExperienceSection(text);
  const now = new Date();
  const nowY = now.getFullYear();
  const nowM = now.getMonth() + 1;

  const spans: { start: number; end: number }[] = [];
  const rangeRe =
    /\b(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)?(19\d{2}|20\d{2})\s*(?:[-–—]|to|until|s\/d|hingga)\s*(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)?(present|current|now|sekarang|19\d{2}|20\d{2})\b/gi;

  let m: RegExpExecArray | null;
  while ((m = rangeRe.exec(section)) !== null) {
    const startYear = parseInt(m[2], 10);
    if (!Number.isFinite(startYear) || startYear < 1985 || startYear > nowY) continue;
    const startMonth = m[1] ? MONTH_MAP[m[1].toLowerCase().slice(0, 3)] ?? 1 : 1;
    const endIdx = parseEndToken(m[3], m[4], nowY, nowM);
    if (endIdx === null) continue;
    const startIdx = monthIndex(startYear, startMonth);
    if (endIdx > startIdx) spans.push({ start: startIdx, end: endIdx });
  }

  return mergeSpanMonths(spans);
}

function detectExplicitYears(text: string): number | null {
  const patterns = [
    /(\d{1,2})\s*\+?\s*years?\s+(?:of\s+)?(?:professional\s+|relevant\s+|work\s+)?experience/i,
    /(\d{1,2})\s*\+?\s*years?\s+(?:of\s+)?(?:exp(?:erience)?)/i,
    /experience\s*[:\-–]\s*(\d{1,2})\s*\+?\s*years?/i,
    /total\s+experience\s*[:\-–]?\s*(\d{1,2})\s*\+?\s*years?/i,
    /(\d{1,2})\s*\+?\s*tahun\s+(?:pengalaman|berpengalaman)/i,
    /pengalaman\s*[:\-–]?\s*(\d{1,2})\s*tahun/i,
    /(\d{1,2})\s*\+?\s*yrs?\b/i,
  ];

  for (const re of patterns) {
    const hit = text.match(re);
    if (hit) {
      const n = parseInt(hit[1], 10);
      if (n >= 0 && n <= 35) return n;
    }
  }
  return null;
}

function yearsSinceGraduation(text: string): number | null {
  const lower = text.toLowerCase();
  const gradRe =
    /(?:bachelor|b\.?\s*s\.?|b\.?\s*eng|sarjana|s1|diploma|master|m\.?\s*eng)[^\n]{0,120}?(20\d{2}|19\d{2})/i;
  const hit = lower.match(gradRe);
  if (!hit) return null;
  const gradYear = parseInt(hit[1], 10);
  const now = new Date().getFullYear();
  if (gradYear < 1990 || gradYear > now) return null;
  const since = now - gradYear;
  if (since <= 0 || since > 35) return null;
  return Math.max(1, Math.min(30, Math.round(since * 0.9)));
}

/** Returns total years of professional experience (0–35). */
export function detectYearsOfExperience(text: string): number {
  const explicit = detectExplicitYears(text);
  if (explicit !== null) return explicit;

  const months = sumEmploymentMonths(text);
  if (months >= 6) {
    return Math.max(1, Math.min(35, Math.round(months / 12)));
  }

  const sinceGrad = yearsSinceGraduation(text);
  if (sinceGrad !== null) return sinceGrad;

  return 3;
}

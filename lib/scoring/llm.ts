/* ============================================================
   NDS TalentScore — optional LLM refinement
   When OPENAI_API_KEY or ANTHROPIC_API_KEY is set, the rule-based
   result is refined with a higher-quality narrative. Uses plain
   fetch (no SDK dependency). Always falls back silently to the
   deterministic result on any error.
   ============================================================ */

import type { Candidate } from "../types";
import type { ResumeFeatures } from "./extract";

export function llmEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

interface Refinement {
  summary?: string;
  highlights?: string[];
  gaps?: string[];
  suggestions?: { type: "add" | "cert" | "kw" | "word"; text: string }[];
}

function buildPrompt(f: ResumeFeatures, base: Candidate): string {
  return [
    "You are an expert System Integrator (SI) technical recruiter.",
    "A rule-based engine has already scored a résumé. Refine ONLY the human-readable narrative.",
    "Return STRICT JSON with keys: summary (string, <=320 chars), highlights (3-4 short strings),",
    "gaps (2-4 short strings), suggestions (array of {type:'add'|'cert'|'kw'|'word', text}).",
    "Do not change any numeric scores. Keep it concise, factual, recruiter-grade.",
    "",
    `Matched role: ${base.role}`,
    `Overall match: ${base.match}. Recommendation: ${base.recommendation}.`,
    `Scores: ${JSON.stringify(base.scores)}`,
    `Detected skills: ${f.skills.join(", ") || "none"}`,
    `Certifications: ${f.certs.map((c) => `${c.name}${c.active ? "" : " (expired)"}`).join(", ") || "none"}`,
    `Years experience: ${f.years}`,
    "",
    "Résumé text (truncated):",
    f.rawText.slice(0, 6000),
  ].join("\n");
}

function safeParse(content: string): Refinement | null {
  try {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as Refinement;
  } catch {
    return null;
  }
}

async function callOpenAI(prompt: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? null;
}

async function callAnthropic(prompt: string): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.content?.[0]?.text ?? null;
}

/** Refine a base candidate's narrative with an LLM, if configured. */
export async function refineWithLLM(
  f: ResumeFeatures,
  base: Candidate
): Promise<Candidate> {
  if (!llmEnabled()) return base;
  try {
    const prompt = buildPrompt(f, base);
    const raw = process.env.OPENAI_API_KEY
      ? await callOpenAI(prompt)
      : await callAnthropic(prompt);
    if (!raw) return base;
    const ref = safeParse(raw);
    if (!ref) return base;
    return {
      ...base,
      summary: ref.summary?.trim() || base.summary,
      highlights: Array.isArray(ref.highlights) && ref.highlights.length ? ref.highlights.slice(0, 4) : base.highlights,
      gaps: Array.isArray(ref.gaps) && ref.gaps.length ? ref.gaps.slice(0, 4) : base.gaps,
      suggestions: Array.isArray(ref.suggestions) && ref.suggestions.length ? ref.suggestions.slice(0, 4) : base.suggestions,
    };
  } catch {
    return base; // never let LLM failures break scoring
  }
}

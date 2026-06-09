/* ============================================================
   NDS TalentScore — scoring entrypoint
   extract features -> deterministic score -> optional LLM refine.
   ============================================================ */

import type { Candidate } from "../types";
import { extractFeatures } from "./extract";
import { scoreFromFeatures } from "./engine";
import { refineWithLLM, llmEnabled } from "./llm";

export { llmEnabled };

let counter = 0;
function nextId(): string {
  counter += 1;
  const rand = Math.random().toString(36).slice(2, 7);
  return `c-${Date.now().toString(36)}-${counter.toString(36)}-${rand}`;
}

export interface ScoreOptions {
  roleHint?: string;
  /** skip the LLM step even when configured (e.g. fast bulk runs) */
  skipLLM?: boolean;
}

/** Score a single résumé's raw text into a Candidate. */
export async function scoreResume(
  rawText: string,
  fileName: string,
  opts: ScoreOptions = {}
): Promise<Candidate> {
  const features = extractFeatures(rawText, fileName);
  const base = scoreFromFeatures(features, {
    id: nextId(),
    sourceFile: fileName,
    roleHint: opts.roleHint,
  });
  if (opts.skipLLM) return base;
  return refineWithLLM(features, base);
}

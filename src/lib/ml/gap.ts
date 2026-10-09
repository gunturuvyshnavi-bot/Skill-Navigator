// Skill overlap, skill gap, job readiness and weighted match score.
export const TFIDF_WEIGHT = 0.6;
export const OVERLAP_WEIGHT = 0.4;

export type GapResult = {
  matched: string[];
  missing: string[];
  overlap: number; // 0..1
  skillGap: number; // 0..100
  readiness: number; // 0..100
};

export function computeGap(userSkills: string[], requiredSkills: string[]): GapResult {
  const have = new Set(userSkills.map((s) => s.toLowerCase()));
  const required = [...new Map(requiredSkills.map((s) => [s.toLowerCase(), s])).values()];
  const matched = required.filter((s) => have.has(s.toLowerCase()));
  const missing = required.filter((s) => !have.has(s.toLowerCase()));
  if (required.length === 0) return { matched, missing, overlap: 0, skillGap: 0, readiness: 0 };
  const skillGap = (missing.length / required.length) * 100;
  return {
    matched,
    missing,
    overlap: matched.length / required.length,
    skillGap: round1(skillGap),
    readiness: round1(100 - skillGap),
  };
}

/** Final = 0.6 × TF-IDF + 0.4 × overlap, scaled to 0–100. Without required skills, TF-IDF only. */
export function weightedScore(tfidf: number, overlap: number, hasRequired: boolean): number {
  const raw = hasRequired ? TFIDF_WEIGHT * tfidf + OVERLAP_WEIGHT * overlap : tfidf;
  return round1(Math.max(0, Math.min(1, raw)) * 100);
}

export function round1(n: number) {
  return Math.round(n * 10) / 10;
}

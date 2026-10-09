// Rule-based roadmap: missing skills ordered Beginner → Intermediate → Advanced,
// then a project step and interview preparation.
const LEVEL_ORDER: Record<string, number> = { Beginner: 0, Intermediate: 1, Advanced: 2 };
export const MAX_SKILL_STEPS = 8;

export type RoadmapStep = {
  step: number;
  title: string;
  skill: string | null;
  level: string | null;
  kind: "skill" | "project" | "interview";
};

export function buildRoadmap(
  targetRole: string,
  missingSkills: string[],
  levelOf: (skill: string) => string,
): RoadmapStep[] {
  const ordered = missingSkills
    .map((s, i) => ({ s, i, level: levelOf(s) }))
    .sort((a, b) => (LEVEL_ORDER[a.level] ?? 1) - (LEVEL_ORDER[b.level] ?? 1) || a.i - b.i)
    .slice(0, MAX_SKILL_STEPS);
  const steps: RoadmapStep[] = ordered.map((o, idx) => ({
    step: idx + 1,
    title: `Learn ${o.s}`,
    skill: o.s,
    level: o.level,
    kind: "skill",
  }));
  steps.push({ step: steps.length + 1, title: `Build a ${targetRole} project`, skill: null, level: null, kind: "project" });
  steps.push({ step: steps.length + 1, title: "Interview preparation", skill: null, level: null, kind: "interview" });
  return steps;
}

export function progressPercent(items: { completed: boolean }[]): number {
  if (items.length === 0) return 0;
  return Math.round((items.filter((i) => i.completed).length / items.length) * 100);
}

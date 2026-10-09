// Skill dictionary + case-insensitive, multi-word aware extraction.
export type SkillEntry = { name: string; aliases: string[]; category: string; level: string };

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function termRegex(term: string) {
  // Boundaries that also work for terms like C++, C#, Node.js
  return new RegExp(`(^|[^a-z0-9+#])${escape(term.toLowerCase())}(?=$|[^a-z0-9+#])`, "i");
}

export function buildAliasIndex(dict: SkillEntry[]): Map<string, string> {
  const idx = new Map<string, string>();
  for (const s of dict) {
    idx.set(s.name.toLowerCase(), s.name);
    for (const a of s.aliases) idx.set(a.toLowerCase(), s.name);
  }
  return idx;
}

/** Map any raw skill string to its canonical dictionary name, or a tidy version of itself. */
export function normalizeSkill(raw: string, aliasIndex: Map<string, string>): string {
  const key = raw.trim().replace(/\s+/g, " ").toLowerCase();
  if (!key) return "";
  return aliasIndex.get(key) ?? raw.trim().replace(/\s+/g, " ");
}

export function extractSkills(resumeText: string, dict: SkillEntry[]): string[] {
  const text = resumeText.toLowerCase();
  const found: string[] = [];
  for (const s of dict) {
    const terms = [s.name, ...s.aliases].filter((t) => t.length > 1 || /^[a-z]$/i.test(t));
    // Single-letter skills (e.g. "C") are too ambiguous for free-text matching
    if (s.name.length === 1) continue;
    if (terms.some((t) => termRegex(t).test(text))) found.push(s.name);
  }
  return [...new Set(found)];
}

/** Merge base dictionary with skills that appear in the job dataset. */
export function mergeDatasetSkills(base: SkillEntry[], datasetSkills: string[]): SkillEntry[] {
  const idx = buildAliasIndex(base);
  const extra = new Map<string, SkillEntry>();
  for (const raw of datasetSkills) {
    const n = raw.trim();
    if (n.length < 2 || idx.has(n.toLowerCase()) || extra.has(n.toLowerCase())) continue;
    extra.set(n.toLowerCase(), { name: n, aliases: [], category: "Dataset", level: "Intermediate" });
  }
  return [...base, ...extra.values()];
}

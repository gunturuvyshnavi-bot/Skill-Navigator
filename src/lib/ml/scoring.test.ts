import { describe, it, expect } from "vitest";
import { computeGap, weightedScore } from "./gap";
import { rankBySimilarity } from "./tfidf";
import { extractSkills } from "./skills";
import { buildRoadmap, progressPercent } from "./roadmap";
import { validateResumeFile } from "@/lib/resume/parser";

describe("skill gap & readiness (spec example)", () => {
  const required = ["Python", "SQL", "Pandas", "Machine Learning", "TensorFlow", "AWS"];
  const user = ["Python", "SQL", "Pandas", "Machine Learning"];
  it("gap = missing / required × 100", () => expect(computeGap(user, required).skillGap).toBe(33.3));
  it("readiness = 100 − gap", () => expect(computeGap(user, required).readiness).toBe(66.7));
  it("lists missing skills", () => expect(computeGap(user, required).missing).toEqual(["TensorFlow", "AWS"]));
});

describe("weighted match", () => {
  it("0.6 × tfidf + 0.4 × overlap scaled to 100", () => expect(weightedScore(0.5, 0.75, true)).toBe(60));
});

describe("tf-idf cosine", () => {
  it("ranks the relevant job higher", () => {
    const [a, b] = rankBySimilarity("python pandas machine learning", ["data scientist python pandas machine learning", "sales executive retail"]);
    expect(a!).toBeGreaterThan(b!);
  });
});

describe("skill extraction", () => {
  const dict = [
    { name: "Machine Learning", aliases: ["ml"], category: "AI", level: "Intermediate" },
    { name: "Node.js", aliases: ["nodejs"], category: "Web", level: "Intermediate" },
    { name: "Java", aliases: [], category: "P", level: "Beginner" },
  ];
  it("case-insensitive, multi-word, not substring", () =>
    expect(extractSkills("Worked on MACHINE learning with NodeJS and JavaScript", dict)).toEqual(["Machine Learning", "Node.js"]));
});

describe("roadmap", () => {
  it("orders beginner before advanced and ends with project + interview", () => {
    const steps = buildRoadmap("Data Scientist", ["TensorFlow", "Statistics"], (s) => (s === "Statistics" ? "Beginner" : "Intermediate"));
    expect(steps.map((s) => s.title)).toEqual(["Learn Statistics", "Learn TensorFlow", "Build a Data Scientist project", "Interview preparation"]);
  });
  it("progress", () => expect(progressPercent([{ completed: true }, { completed: false }, { completed: false }, { completed: false }, { completed: true }])).toBe(40));
});

describe("upload validation", () => {
  it("rejects other types", () => expect(validateResumeFile("cv.txt", "text/plain", 100)).toEqual({ error: "Only PDF or DOCX files are supported." }));
  it("rejects > 5 MB", () => expect("error" in validateResumeFile("cv.pdf", "application/pdf", 5 * 1024 * 1024 + 1)).toBe(true));
  it("accepts docx", () => expect(validateResumeFile("cv.docx", "", 1000)).toEqual({ kind: "docx" }));
});

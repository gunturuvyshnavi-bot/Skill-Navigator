// Text normalisation + tokenisation shared by TF-IDF and skill extraction.
const STOPWORDS = new Set(
  "a an and are as at be by for from has have in is it its of on or that the to was were will with we you your our this they their i me my he she his her them who what which when where why how all any both each few more most other some such no nor not only own same so than too very can just should now also etc experience years year work working role job candidate candidates responsibilities requirements required skills skill good strong knowledge ability using use used".split(
    " ",
  ),
);

export function cleanText(raw: string): string {
  return raw
    .replace(/\u0000/g, " ")
    .replace(/[\r\t\f\v]+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^\.+|\.+$/g, ""))
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

// TF-IDF vectoriser + cosine similarity (same formulas as scikit-learn's
// TfidfVectorizer with smooth_idf=True and l2 normalisation).
import { tokenize } from "./text";

export type SparseVector = Map<string, number>;

export function fitTransform(docs: string[]): SparseVector[] {
  const tokenized = docs.map(tokenize);
  const n = docs.length;
  const df = new Map<string, number>();
  for (const toks of tokenized) {
    for (const t of new Set(toks)) df.set(t, (df.get(t) ?? 0) + 1);
  }
  return tokenized.map((toks) => {
    const tf = new Map<string, number>();
    for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1);
    const vec: SparseVector = new Map();
    let norm = 0;
    for (const [t, c] of tf) {
      const idf = Math.log((1 + n) / (1 + (df.get(t) ?? 0))) + 1;
      const w = c * idf;
      vec.set(t, w);
      norm += w * w;
    }
    norm = Math.sqrt(norm);
    if (norm > 0) for (const [t, w] of vec) vec.set(t, w / norm);
    return vec;
  });
}

export function cosineSimilarity(a: SparseVector, b: SparseVector): number {
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [t, w] of small) {
    const o = large.get(t);
    if (o) dot += w * o;
  }
  for (const w of a.values()) na += w * w;
  for (const w of b.values()) nb += w * w;
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Similarity of one query document against each corpus document. */
export function rankBySimilarity(query: string, corpus: string[]): number[] {
  const vectors = fitTransform([query, ...corpus]);
  const q = vectors[0]!;
  return vectors.slice(1).map((v) => cosineSimilarity(q, v));
}

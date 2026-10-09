// PDF (unpdf) and DOCX (zip + document.xml) text extraction — Worker-safe.
import { cleanText } from "@/lib/ml/text";

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
export const PDF_MIME = "application/pdf";
export const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type ResumeKind = "pdf" | "docx";

/** Validates name/type/size; returns an error message or the detected kind. */
export function validateResumeFile(name: string, type: string, size: number): { kind: ResumeKind } | { error: string } {
  const lower = name.toLowerCase();
  const kind: ResumeKind | null =
    lower.endsWith(".pdf") || type === PDF_MIME ? "pdf" : lower.endsWith(".docx") || type === DOCX_MIME ? "docx" : null;
  if (!kind) return { error: "Only PDF or DOCX files are supported." };
  if (size === 0) return { error: "This file is empty." };
  if (size > MAX_RESUME_BYTES) return { error: "File is too large. Maximum size is 5 MB." };
  return { kind };
}

export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  try {
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    return Array.isArray(text) ? text.join("\n") : text;
  } catch {
    throw new Error("This PDF looks corrupted or password-protected.");
  }
}

export async function extractDocxText(bytes: Uint8Array): Promise<string> {
  const { unzipSync, strFromU8 } = await import("fflate");
  let xml: string;
  try {
    const files = unzipSync(bytes, { filter: (f) => f.name === "word/document.xml" });
    const doc = files["word/document.xml"];
    if (!doc) throw new Error();
    xml = strFromU8(doc);
  } catch {
    throw new Error("This DOCX file looks corrupted.");
  }
  return xml
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:tab\/>/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export function cleanResumeText(raw: string) {
  return cleanText(raw);
}

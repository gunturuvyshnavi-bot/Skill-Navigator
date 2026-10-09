// Browser upload to private storage with real progress events (XHR).
import { supabase } from "@/integrations/supabase/client";

export async function uploadResumeFile(file: File, onProgress: (pct: number) => void): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const userId = data.session?.user.id;
  if (!token || !userId) throw new Error("Your session expired. Please log in again.");
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
  const path = `${userId}/${Date.now()}-${safe}`;
  const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/resumes/${path}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(xhr.status === 413 ? "File is too large. Maximum size is 5 MB." : "Upload failed. Please try again."));
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(file);
  });
  return path;
}

import { ApiError } from "./client";
import type { GeminiSource } from "../types/geminiSource";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export async function listGeminiSources(examId: number): Promise<GeminiSource[]> {
  const res = await fetch(`${API_BASE}/api/exams/${examId}/gemini-sources`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new ApiError(await parseDetail(res), res.status);
  }
  return res.json() as Promise<GeminiSource[]>;
}

export async function uploadGeminiSource(
  examId: number,
  file: File,
  sourceType: "exercises_file" | "course_file",
): Promise<GeminiSource> {
  const form = new FormData();
  form.append("file", file);
  form.append("source_type", sourceType);
  const res = await fetch(`${API_BASE}/api/exams/${examId}/gemini-sources`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (!res.ok) {
    throw new ApiError(await parseDetail(res), res.status);
  }
  return res.json() as Promise<GeminiSource>;
}

export async function updateGeminiSource(
  sourceId: number,
  patch: { use_as_style?: boolean; use_as_content?: boolean },
): Promise<GeminiSource> {
  const res = await fetch(`${API_BASE}/api/gemini-sources/${sourceId}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    throw new ApiError(await parseDetail(res), res.status);
  }
  return res.json() as Promise<GeminiSource>;
}

export async function deleteGeminiSource(sourceId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/gemini-sources/${sourceId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    throw new ApiError(await parseDetail(res), res.status);
  }
}

async function parseDetail(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return typeof data.detail === "string" ? data.detail : "אירעה שגיאה";
  } catch {
    return "אירעה שגיאה";
  }
}

import { ApiError, resolveApiUrl } from "./client";

export interface TaskStepRow {
  id: number;
  order_index: number;
  title: string;
  instructions: string;
  max_points: number;
  proof_filename?: string | null;
  proof_ready?: boolean;
}

export interface TaskReviewRow {
  step_id: number;
  title: string;
  instructions: string;
  max_points: number;
  order_index: number;
  proof_filename: string | null;
  has_proof: boolean;
  verdict: "done" | "partial" | "not_done" | null;
  score: number | null;
  ai_score: number | null;
  appreciation: string | null;
  source: "auto" | "ai" | "teacher" | null;
}

async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { detail?: unknown };
    return typeof data.detail === "string" ? data.detail : "אירעה שגיאה";
  } catch {
    return "אירעה שגיאה";
  }
}

export async function uploadTaskProof(sessionId: number, stepId: number, file: File): Promise<TaskStepRow> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(resolveApiUrl(`/api/exams/sessions/${sessionId}/steps/${stepId}/proof`), {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (!res.ok) throw new ApiError(await readError(res), res.status);
  return res.json() as Promise<TaskStepRow>;
}

export async function fetchProofObjectUrl(path: string): Promise<string> {
  const res = await fetch(resolveApiUrl(path), { credentials: "include" });
  if (!res.ok) throw new ApiError(await readError(res), res.status);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

import { api } from "./client";

export type AiPromptTemplate = {
  key: string;
  body: string;
  version: number;
  updated_at: string | null;
  placeholders: string[];
  required: string[];
  is_custom: boolean;
};

export function fetchAiPromptTemplates(): Promise<AiPromptTemplate[]> {
  return api<AiPromptTemplate[]>("/api/admin/ai-prompts");
}

export function updateAiPromptTemplate(key: string, body: string): Promise<AiPromptTemplate> {
  return api<AiPromptTemplate>(`/api/admin/ai-prompts/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: JSON.stringify({ body }),
  });
}

export function resetAiPromptTemplate(key: string): Promise<AiPromptTemplate> {
  return api<AiPromptTemplate>(`/api/admin/ai-prompts/${encodeURIComponent(key)}/reset`, {
    method: "POST",
  });
}

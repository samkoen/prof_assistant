import { he } from "../i18n/he";

export function aiPromptUsage(key: string): string {
  const map = he.aiPromptUsageByKey as Record<string, string>;
  return map[key] ?? "";
}

import type { GeminiGenerationMessage } from "../types/geminiQuestionSeries";

/** Dernier message user envoyé à Gemini avant la réponse modèle courante. */
export function lastGeminiUserPrompt(messages: GeminiGenerationMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role !== "model") continue;
    for (let j = i - 1; j >= 0; j -= 1) {
      if (messages[j].role === "user") return messages[j].content;
    }
  }
  return messages.find((m) => m.role === "user")?.content ?? null;
}

export function logGeminiPrompt(messages: GeminiGenerationMessage[]): void {
  const prompt = lastGeminiUserPrompt(messages);
  if (!prompt) return;
  console.log("[Gemini prompt]", prompt);
}

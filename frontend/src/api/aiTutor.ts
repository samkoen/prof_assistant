import { api } from "./client";
import type { TutorAction } from "../utils/tutorQuickActions";

export interface TutorMessage {
  id: number;
  role: "user" | "model";
  content: string;
  created_at?: string | null;
}

export interface TutorThread {
  question_id: number;
  messages: TutorMessage[];
  remaining_messages: number;
  exam_remaining_messages: number;
  max_message_chars: number;
  charged: boolean;
}

function tutorPath(sessionId: number, questionId: number): string {
  return `/api/exams/sessions/${sessionId}/questions/${questionId}/tutor`;
}

export function fetchTutorThread(sessionId: number, questionId: number, forPractice: boolean) {
  return api<TutorThread>(`${tutorPath(sessionId, questionId)}?for_practice=${forPractice}`);
}

export function sendTutorMessage(
  sessionId: number,
  questionId: number,
  body: { text: string; action?: TutorAction | null; forPractice: boolean }
) {
  return api<TutorThread>(`${tutorPath(sessionId, questionId)}/messages`, {
    method: "POST",
    body: JSON.stringify({ text: body.text, action: body.action ?? null, for_practice: body.forPractice }),
  });
}

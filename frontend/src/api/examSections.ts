import { api, type Exam, type ExamSection, type ExamSectionInput } from "./client";

const base = (examId: number) => `/api/exams/${examId}/sections`;

export function createSection(examId: number, input: ExamSectionInput): Promise<ExamSection> {
  return api<ExamSection>(base(examId), { method: "POST", body: JSON.stringify(input) });
}

export function updateSection(examId: number, sectionId: number, input: ExamSectionInput): Promise<ExamSection> {
  return api<ExamSection>(`${base(examId)}/${sectionId}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deleteSection(examId: number, sectionId: number): Promise<void> {
  await api(`${base(examId)}/${sectionId}`, { method: "DELETE" });
}

/** Rattache des questions à une partie (null = hors partie). */
export async function assignQuestionsToSection(examId: number, questionIds: number[], sectionId: number | null): Promise<void> {
  await api(`${base(examId)}/assign`, { method: "PUT", body: JSON.stringify({ question_ids: questionIds, section_id: sectionId }) });
}

/** Consigne générale (haut du sujet) et plafond de note. */
export function updateExamStructure(examId: number, patch: { description?: string | null; score_cap?: number | null }): Promise<Exam> {
  return api<Exam>(`/api/exams/${examId}`, { method: "PATCH", body: JSON.stringify(patch) });
}

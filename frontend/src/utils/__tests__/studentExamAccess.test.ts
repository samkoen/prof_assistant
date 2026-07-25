import { describe, expect, it } from "vitest";
import type { ExamAttempt, ExamSession } from "../../api/client";
import { canStudentAccessExam } from "../studentExamAccess";

function session(status: ExamSession["status"]): ExamSession {
  return { status } as ExamSession;
}

function attempt(
  fields: Partial<Pick<ExamAttempt, "started_at" | "submitted_at">>,
): ExamAttempt {
  return fields as ExamAttempt;
}

describe("canStudentAccessExam", () => {
  it("autorise une session active même sans tentative", () => {
    expect(canStudentAccessExam(session("active"), null)).toBe(true);
  });

  it("refuse draft/closed sans tentative démarrée", () => {
    expect(canStudentAccessExam(session("draft"), null)).toBe(false);
    expect(canStudentAccessExam(session("closed"), null)).toBe(false);
  });

  it("autorise si déjà démarré ou soumis", () => {
    expect(
      canStudentAccessExam(session("closed"), attempt({ started_at: "2026-01-01" })),
    ).toBe(true);
    expect(
      canStudentAccessExam(session("closed"), attempt({ submitted_at: "2026-01-01" })),
    ).toBe(true);
  });
});

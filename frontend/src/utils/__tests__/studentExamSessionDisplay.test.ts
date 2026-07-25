import { describe, expect, it } from "vitest";
import type { ExamAttempt, ExamSession } from "../../api/client";
import { he } from "../../i18n/he";
import { studentExamChipProps } from "../studentExamSessionDisplay";

function session(status: ExamSession["status"]): ExamSession {
  return { status } as ExamSession;
}

function attempt(
  fields: Partial<Pick<ExamAttempt, "started_at" | "submitted_at">>,
): ExamAttempt {
  return fields as ExamAttempt;
}

describe("studentExamChipProps", () => {
  it("soumis → alreadySubmitted", () => {
    expect(
      studentExamChipProps(
        session("active"),
        attempt({ submitted_at: "2026-01-01T00:00:00Z" }),
      ),
    ).toEqual({ label: he.alreadySubmitted, color: "default" });
  });

  it("démarré → examInProgress", () => {
    expect(
      studentExamChipProps(
        session("active"),
        attempt({ started_at: "2026-01-01T00:00:00Z" }),
      ),
    ).toEqual({ label: he.examInProgress, color: "success" });
  });

  it("fermé sans tentative → examClosed", () => {
    expect(studentExamChipProps(session("closed"), null)).toEqual({
      label: he.examClosed,
      color: "default",
    });
  });

  it("actif sans tentative → examInProgress", () => {
    expect(studentExamChipProps(session("active"), null)).toEqual({
      label: he.examInProgress,
      color: "success",
    });
  });
});

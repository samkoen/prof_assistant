import { describe, expect, it } from "vitest";
import { he } from "../../i18n/he";
import { sessionStatusView, sessionTargetPath } from "../examStatus";

describe("sessionTargetPath", () => {
  const base = { id: 4, exam_id: 12, offering_id: 9 };

  it("mène à l'éditeur pour un brouillon", () => {
    expect(sessionTargetPath({ ...base, status: "draft" })).toBe("/teacher/exams/12/edit");
  });

  it("mène aux résultats pour une session active ou close", () => {
    const expected = "/teacher/courses/9/exams/sessions/4/results";
    expect(sessionTargetPath({ ...base, status: "active" })).toBe(expected);
    expect(sessionTargetPath({ ...base, status: "closed" })).toBe(expected);
  });
});

describe("sessionStatusView", () => {
  it("distingue la pratique, le brouillon et le mode actif", () => {
    expect(sessionStatusView({ status: "active", is_tirgoul: true, results_published: false }).key).toBe("practice");
    expect(sessionStatusView({ status: "draft", results_published: false }).tone).toBe("neutral");
    const active = sessionStatusView({ status: "active", results_published: false });
    expect(active).toEqual({ key: "active", label: he.examStatusActive, tone: "success" });
  });

  it("signale un examen clos dont les notes ne sont pas publiées", () => {
    const view = sessionStatusView({ status: "closed", results_published: false });
    expect(view.key).toBe("awaiting_publish");
    expect(view.tone).toBe("warning");
  });

  it("marque un examen clos et publié comme terminé", () => {
    expect(sessionStatusView({ status: "closed", results_published: true }).key).toBe("finished");
  });
});

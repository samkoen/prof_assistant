import { describe, expect, it } from "vitest";
import type { TeacherShare } from "../../api/client";
import { he } from "../../i18n/he";
import { addableStudents, countByStatus, enrollmentStatusView } from "../enrollmentStatus";
import { shareStatusView, shareSummary, splitShares } from "../teacherShares";

describe("enrollmentStatus", () => {
  it("associe un libellé et un ton à chaque statut", () => {
    expect(enrollmentStatusView("approved")).toEqual({ label: he.enrollmentStatusApproved, tone: "success" });
    expect(enrollmentStatusView("pending").tone).toBe("warning");
    expect(enrollmentStatusView("rejected").tone).toBe("danger");
  });

  it("compte par statut", () => {
    const counts = countByStatus([{ status: "approved" }, { status: "approved" }, { status: "pending" }]);
    expect(counts).toEqual({ approved: 2, pending: 1, rejected: 0 });
  });

  it("propose seulement les étudiants non approuvés (en attente ou refusés restent ajoutables)", () => {
    const all = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const enrollments = [
      { student_id: 1, status: "approved" as const },
      { student_id: 2, status: "pending" as const },
    ];
    expect(addableStudents(all, enrollments)).toEqual([{ id: 2 }, { id: 3 }]);
  });
});

function share(patch: Partial<TeacherShare>): TeacherShare {
  return {
    id: 1,
    share_type: "exam",
    status: "pending",
    sender_id: 1,
    sender_name: "דנה",
    recipient_id: 2,
    recipient_name: "יוסי",
    source_exam_id: 5,
    source_exam_title: "אלגברה",
    source_catalog_id: null,
    source_catalog_name: null,
    source_exam_count: null,
    target_catalog_id: null,
    target_catalog_name: null,
    message: null,
    created_at: "2026-01-01T00:00:00Z",
    resolved_at: null,
    suggested_catalog_id: null,
    ...patch,
  };
}

describe("teacherShares", () => {
  it("donne un ton par statut de partage", () => {
    expect(shareStatusView("pending").tone).toBe("warning");
    expect(shareStatusView("accepted").tone).toBe("success");
    expect(shareStatusView("declined").tone).toBe("neutral");
  });

  it("résume un examen ou un cours catalogue", () => {
    expect(shareSummary(share({}))).toBe("אלגברה");
    const catalog = share({ share_type: "catalog", source_catalog_name: "מתמטיקה", source_exam_count: 4 });
    expect(shareSummary(catalog)).toBe(`מתמטיקה (4 ${he.exams})`);
  });

  it("garde les partages entrants en attente et trie par date décroissante", () => {
    const old = share({ id: 1, created_at: "2026-01-01T00:00:00Z" });
    const recent = share({ id: 2, created_at: "2026-03-01T00:00:00Z" });
    const done = share({ id: 3, status: "accepted" });
    const { pendingIncoming, sentSorted } = splitShares([old, recent, done], [old, recent]);
    expect(pendingIncoming.map((s) => s.id)).toEqual([2, 1]);
    expect(sentSorted.map((s) => s.id)).toEqual([2, 1]);
  });
});

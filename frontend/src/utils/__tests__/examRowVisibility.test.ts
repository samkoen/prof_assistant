import { describe, expect, it } from "vitest";
import { examDateSortValue, isVisibleToStudents } from "../examRowVisibility";

const exam = (hidden?: boolean) => ({ hidden_from_students: hidden });
const session = (status: "draft" | "active" | "closed") => ({
  status,
  activated_at: null,
  closed_at: null,
});

describe("isVisibleToStudents", () => {
  it("is visible when the session is active or closed and the exam is not hidden", () => {
    expect(isVisibleToStudents({ exam: exam(false), session: session("active") })).toBe(true);
    expect(isVisibleToStudents({ exam: exam(), session: session("closed") })).toBe(true);
  });

  it("is not visible when hidden, even if active", () => {
    expect(isVisibleToStudents({ exam: exam(true), session: session("active") })).toBe(false);
  });

  it("is not visible for a draft session or without a session", () => {
    expect(isVisibleToStudents({ exam: exam(false), session: session("draft") })).toBe(false);
    expect(isVisibleToStudents({ exam: exam(false) })).toBe(false);
  });
});

describe("examDateSortValue", () => {
  it("orders newer activations above older ones when sorted descending", () => {
    const older = examDateSortValue({ activated_at: "2026-01-01T10:00:00Z", closed_at: null });
    const newer = examDateSortValue({ activated_at: "2026-06-01T10:00:00Z", closed_at: null });
    expect(newer).toBeGreaterThan(older);
  });

  it("puts a session without a date first in a most-recent-first order", () => {
    const dated = examDateSortValue({ activated_at: "2026-06-01T10:00:00Z", closed_at: null });
    expect(examDateSortValue(undefined)).toBeGreaterThan(dated);
    expect(examDateSortValue({ activated_at: null, closed_at: null })).toBeGreaterThan(dated);
  });
});

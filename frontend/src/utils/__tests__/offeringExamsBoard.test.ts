import { describe, expect, it } from "vitest";
import { splitBoardRows } from "../../hooks/useOfferingExamsBoard";

const exam = (id: number) => ({ id }) as never;
const session = (exam_id: number, status: string) => ({ exam_id, status }) as never;

describe("splitBoardRows", () => {
  it("met les examens sans session ou non clôturés dans « ouverts »", () => {
    const { openRows, closedRows } = splitBoardRows([exam(1), exam(2), exam(3)], [session(2, "active"), session(3, "closed")]);
    expect(openRows.map((r) => r.exam.id)).toEqual([1, 2]);
    expect(closedRows.map((r) => r.exam.id)).toEqual([3]);
  });

  it("associe la session à son examen", () => {
    const { openRows } = splitBoardRows([exam(1)], [session(1, "draft")]);
    expect(openRows[0].session?.status).toBe("draft");
  });
});

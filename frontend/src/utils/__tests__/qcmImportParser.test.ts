import { describe, expect, it } from "vitest";
import { parseQcmText, toImportPayload } from "../qcmImportParser";

const SAMPLE = `
Q1 [single] (1 pt)
מהי בירת ישראל?
A) תל אביב
B) * ירושלים
C) חיפה
---
Q2 [multiple] (2 pt)
בחרו נכון
A) * אחד
B) שניים
C) * שלוש
`;

describe("qcmImportParser", () => {
  it("parse un QCM valide single + multiple", () => {
    const result = parseQcmText(SAMPLE);
    expect(result.errors).toEqual([]);
    expect(result.questions).toHaveLength(2);
    expect(result.questions[0].question_type).toBe("single");
    expect(result.questions[0].options.filter((o) => o.is_correct)).toHaveLength(1);
    expect(result.questions[1].question_type).toBe("multiple");
    expect(result.questions[1].options.filter((o) => o.is_correct)).toHaveLength(2);
  });

  it("signale une single sans *", () => {
    const raw = `
Q1 [single]
שאלה בלי כוכב
A) אחת
B) שתיים
`;
    const result = parseQcmText(raw);
    expect(result.questions).toHaveLength(0);
    expect(result.errors.some((e) => e.message.includes("נכונה"))).toBe(true);
  });

  it("convertit vers le payload d'import API", () => {
    const { questions } = parseQcmText(SAMPLE);
    const payload = toImportPayload(questions);
    expect(payload[0].order_index).toBe(0);
    expect(payload[1].order_index).toBe(1);
    expect(payload[0].options[0].order_index).toBe(0);
  });
});

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
---
Q3 [open] (2 pt)
הסבירו חיפוש בינארי.
ANSWER:
חצייה חוזרת של מערך ממוין.
`;

describe("qcmImportParser", () => {
  it("parse un QCM valide single + multiple", () => {
    const result = parseQcmText(SAMPLE);
    expect(result.errors).toEqual([]);
    expect(result.questions).toHaveLength(3);
    expect(result.questions[0].question_type).toBe("single");
    expect(result.questions[0].options.filter((o) => o.is_correct)).toHaveLength(1);
    expect(result.questions[1].question_type).toBe("multiple");
    expect(result.questions[1].options.filter((o) => o.is_correct)).toHaveLength(2);
    expect(result.questions[2].question_type).toBe("open");
    expect(result.questions[2].options).toEqual([]);
    expect(result.questions[2].model_answer).toContain("חצייה");
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

  it("importe une question ouverte sans A) B) C)", () => {
    const result = parseQcmText(`
Q1 [open] (2 pt)
הסבירו מהו חיפוש בינארי.
`);
    expect(result.errors).toEqual([]);
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].question_type).toBe("open");
    expect(result.questions[0].options).toEqual([]);
    expect(result.questions[0].text).toContain("חיפוש בינארי");
  });

  it("traite Q1 sans type ni options comme question ouverte", () => {
    const result = parseQcmText(`
Q1 (2 pt)
הסבירו את ההבדל בין מערך לרשימה.
`);
    expect(result.errors).toEqual([]);
    expect(result.questions[0].question_type).toBe("open");
    expect(result.questions[0].options).toEqual([]);
    expect(result.questions[0].points).toBe(2);
  });

  it("accepte [open] sur la même ligne que le texte", () => {
    const result = parseQcmText(`Q1 [open] הסבירו מיון מהיר.`);
    expect(result.errors).toEqual([]);
    expect(result.questions[0].question_type).toBe("open");
    expect(result.questions[0].text).toBe("הסבירו מיון מהיר.");
  });

  it("refuse une single explicite sans options", () => {
    const result = parseQcmText(`
Q1 [single]
שאלה בלי אפשרויות
`);
    expect(result.questions).toHaveLength(0);
    expect(result.errors.some((e) => e.message.includes("אפשרויות"))).toBe(true);
  });
});

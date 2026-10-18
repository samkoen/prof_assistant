import { describe, expect, it } from "vitest";
import { he } from "../../i18n/he";
import { verdictLabel } from "../taskVerdict";

describe("verdictLabel", () => {
  it("traduit les trois verdicts et l'attente", () => {
    expect(verdictLabel("done")).toBe(he.taskVerdictDone);
    expect(verdictLabel("partial")).toBe(he.taskVerdictPartial);
    expect(verdictLabel("not_done")).toBe(he.taskVerdictNotDone);
    expect(verdictLabel(null)).toBe(he.taskVerdictPending);
  });
});

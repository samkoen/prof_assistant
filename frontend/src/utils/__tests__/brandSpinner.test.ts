import { describe, expect, it } from "vitest";
import { brandSpinnerMetrics } from "../brandSpinner";

describe("brandSpinnerMetrics", () => {
  it("garde le joyau plus petit que l’anneau", () => {
    const m = brandSpinnerMetrics(52);
    expect(m.trackWidth).toBeGreaterThanOrEqual(3);
    expect(m.hole).toBeLessThan(52);
    expect(m.jewel).toBeLessThan(m.hole);
    expect(m.iconSize).toBeLessThan(m.jewel);
  });

  it("reste lisible en petit format", () => {
    const m = brandSpinnerMetrics(28);
    expect(m.trackWidth).toBe(3);
    expect(m.jewel).toBeGreaterThan(8);
  });
});

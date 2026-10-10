import { describe, expect, it } from "vitest";
import { brandSpinnerMetrics, dotSize, ORBIT_MIN_SIZE, spinnerVariant } from "../brandSpinner";

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

  it("place l'anneau intérieur à l'intérieur de l'anneau extérieur", () => {
    const m = brandSpinnerMetrics(52);
    expect(m.innerInset).toBeGreaterThan(m.trackWidth);
    expect(m.innerTrackWidth).toBeLessThanOrEqual(m.trackWidth);
  });

  it("n'affiche l'étincelle que sur les grandes tailles", () => {
    expect(brandSpinnerMetrics(64).showIcon).toBe(true);
    expect(brandSpinnerMetrics(36).showIcon).toBe(false);
  });
});

describe("spinnerVariant", () => {
  it("choisit les points en compact et l'orbite en grand", () => {
    expect(spinnerVariant(18)).toBe("dots");
    expect(spinnerVariant(ORBIT_MIN_SIZE - 1)).toBe("dots");
    expect(spinnerVariant(ORBIT_MIN_SIZE)).toBe("orbit");
    expect(spinnerVariant(40)).toBe("orbit");
  });

  it("garde trois points dans la largeur disponible", () => {
    for (const size of [16, 18, 22, 28]) {
      const d = dotSize(size);
      expect(d * 3 + 2 * 2).toBeLessThanOrEqual(size + 4);
    }
  });
});

import { describe, expect, it } from "vitest";
import { creditsText, generationCostView } from "../generationCost";

const preview = { estimated_credits: 1, max_credits: 1, calls_per_credit: 5 };

describe("creditsText", () => {
  it("uses singular, plural and free labels", () => {
    expect(creditsText(0)).toBe("ללא עלות");
    expect(creditsText(1)).toBe("קרדיט אחד");
    expect(creditsText(3)).toBe("3 קרדיטים");
  });
});

describe("generationCostView", () => {
  it("shows cost, what a credit includes and the balance", () => {
    const view = generationCostView(preview, { total: 3, unlimited: false });
    expect(view.cost).toBe("קרדיט אחד");
    expect(view.includes).toContain("5");
    expect(view.balance).toContain("3");
    expect(view.insufficient).toBe(false);
    expect(view.worstCase).toBeNull();
  });

  it("flags an insufficient balance", () => {
    expect(generationCostView(preview, { total: 0, unlimited: false }).insufficient).toBe(true);
  });

  it("mentions the worst case only when it is higher", () => {
    const view = generationCostView({ ...preview, max_credits: 3 }, null);
    expect(view.worstCase).toContain("3");
    expect(view.balance).toBeNull();
  });

  it("is free for unlimited or zero-cost users", () => {
    const free = generationCostView({ estimated_credits: 0, max_credits: 0, calls_per_credit: 5 }, null);
    expect(free.cost).toBe("ללא עלות");
    expect(free.includes).toBeNull();
    expect(generationCostView(preview, { total: 0, unlimited: true }).insufficient).toBe(false);
  });
});

import { describe, expect, it, vi } from "vitest";
import { shareInFlight } from "../inFlight";

describe("shareInFlight", () => {
  it("ne lance qu'un appel pour deux demandes simultanées de même clé", async () => {
    const run = vi.fn(() => Promise.resolve("évaluation"));
    const [a, b] = await Promise.all([shareInFlight("k", run), shareInFlight("k", run)]);
    expect(run).toHaveBeenCalledTimes(1);
    expect([a, b]).toEqual(["évaluation", "évaluation"]);
  });
  it("relance un appel une fois le précédent terminé, même après un échec", async () => {
    const run = vi.fn().mockRejectedValueOnce(new Error("503")).mockResolvedValueOnce("ok");
    await expect(shareInFlight("k2", run)).rejects.toThrow("503");
    await expect(shareInFlight("k2", run)).resolves.toBe("ok");
    expect(run).toHaveBeenCalledTimes(2);
  });
  it("ne mélange pas deux clés différentes", async () => {
    const run = vi.fn(() => Promise.resolve(1));
    await Promise.all([shareInFlight("a", run), shareInFlight("b", run)]);
    expect(run).toHaveBeenCalledTimes(2);
  });
});

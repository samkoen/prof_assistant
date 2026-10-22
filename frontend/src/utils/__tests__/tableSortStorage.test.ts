import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadTableSort, saveTableSort } from "../tableSortStorage";

const fallback = { key: "exam_date", order: "desc" } as const;
const keys = ["title", "exam_date"];

function stubStorage(): Map<string, string> {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  });
  return store;
}

describe("tableSortStorage", () => {
  beforeEach(() => {
    stubStorage();
  });

  it("returns the fallback when nothing was saved", () => {
    expect(loadTableSort("k", keys, fallback)).toEqual(fallback);
  });

  it("restores a saved sort", () => {
    saveTableSort("k", { key: "title", order: "asc" });
    expect(loadTableSort("k", keys, fallback)).toEqual({ key: "title", order: "asc" });
  });

  it("ignores a sort on a column that no longer exists", () => {
    saveTableSort("k", { key: "gone", order: "asc" });
    expect(loadTableSort("k", keys, fallback)).toEqual(fallback);
  });

  it("ignores corrupted data", () => {
    const store = stubStorage();
    store.set("k", "{not json");
    expect(loadTableSort("k", keys, fallback)).toEqual(fallback);
    store.set("k", JSON.stringify({ key: "title", order: "sideways" }));
    expect(loadTableSort("k", keys, fallback)).toEqual(fallback);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  EXAM_SESSION_TOKEN_HEADER,
  clearExamSessionToken,
  examSessionTokenHeaders,
  getExamSessionToken,
  rememberAttemptSessionToken,
  setExamSessionToken,
} from "../examSessionToken";

function stubSessionStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  });
}

describe("examSessionToken", () => {
  beforeEach(() => {
    stubSessionStorage();
  });

  it("stocke et lit le token par session", () => {
    expect(getExamSessionToken(12)).toBeNull();
    setExamSessionToken(12, "abc");
    expect(getExamSessionToken(12)).toBe("abc");
    expect(examSessionTokenHeaders(12)).toEqual({
      [EXAM_SESSION_TOKEN_HEADER]: "abc",
    });
  });

  it("ignore les tokens vides et efface correctement", () => {
    setExamSessionToken(1, "tok");
    setExamSessionToken(1, null);
    expect(getExamSessionToken(1)).toBe("tok");
    clearExamSessionToken(1);
    expect(getExamSessionToken(1)).toBeNull();
    expect(examSessionTokenHeaders(1)).toEqual({});
  });

  it("mémorise depuis une tentative API", () => {
    rememberAttemptSessionToken(5, { session_token: "from-api" });
    expect(getExamSessionToken(5)).toBe("from-api");
    rememberAttemptSessionToken(5, { session_token: null });
    expect(getExamSessionToken(5)).toBe("from-api");
  });
});

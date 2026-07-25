import { describe, expect, it, vi } from "vitest";
import {
  authPathWithJoin,
  joinRedirectPath,
  parseJoinTargetFromQrPayload,
} from "../joinCourse";

describe("joinCourse", () => {
  it("construit les chemins login/register", () => {
    expect(joinRedirectPath("42")).toBe("/join/42");
    expect(joinRedirectPath("AbCdEfGhIjKlMnOp")).toBe("/join/t/AbCdEfGhIjKlMnOp");
    expect(authPathWithJoin("login", "7")).toBe("/login?join=7");
    expect(authPathWithJoin("register", "tok_value_123456")).toContain("joinToken=");
  });

  it("parse un QR token ou legacy id", () => {
    vi.stubGlobal("window", { location: { origin: "https://app.test" } });
    expect(parseJoinTargetFromQrPayload("https://app.test/join/t/TokenValue123456")).toEqual({
      kind: "token",
      token: "TokenValue123456",
    });
    expect(parseJoinTargetFromQrPayload("/join/99")).toEqual({
      kind: "legacyId",
      offeringId: 99,
    });
    expect(parseJoinTargetFromQrPayload("TokenValue12345678")).toEqual({
      kind: "token",
      token: "TokenValue12345678",
    });
    expect(parseJoinTargetFromQrPayload("")).toBeNull();
  });
});

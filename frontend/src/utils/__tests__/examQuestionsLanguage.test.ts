import { describe, expect, it } from "vitest";
import { contentDirForLine } from "../examQuestionsLanguage";

describe("contentDirForLine", () => {
  it("affiche le Java en LTR même avec un commentaire hébreu", () => {
    const line = "int[] arr = new int[5]; // מאתחל את כל האיברים ל-0";
    expect(contentDirForLine(line)).toBe("ltr");
    expect(contentDirForLine("System.out.println(arr[0]);")).toBe("ltr");
  });

  it("garde l'hébreu en RTL", () => {
    expect(contentDirForLine("הגודל קבוע בעת היצירה")).toBe("rtl");
  });
});

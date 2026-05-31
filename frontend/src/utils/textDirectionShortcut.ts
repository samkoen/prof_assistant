import type { KeyboardEvent } from "react";

export type TextDirection = "ltr" | "rtl";

/** Ctrl+Shift+→ LTR, Ctrl+Shift+← RTL (comme Google Docs). */
export function handleTextDirectionShortcut(
  e: KeyboardEvent,
  onDirection: (dir: TextDirection) => void,
): void {
  if (!e.ctrlKey || !e.shiftKey) return;
  if (e.key === "ArrowRight") {
    e.preventDefault();
    onDirection("ltr");
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    onDirection("rtl");
  }
}

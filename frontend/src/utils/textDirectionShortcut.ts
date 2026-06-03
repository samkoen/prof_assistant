import type { KeyboardEvent } from "react";

export type TextDirection = "ltr" | "rtl";

type KeyLike = Pick<KeyboardEvent, "key" | "code" | "ctrlKey" | "metaKey" | "shiftKey" | "altKey" | "preventDefault" | "stopPropagation">;

function isArrow(code: string, key: string, arrow: "Left" | "Right"): boolean {
  return code === `Arrow${arrow}` || key === `Arrow${arrow}`;
}

/** Ctrl+Shift+→ LTR, Ctrl+Shift+← RTL ; secours Alt+Shift (Windows bloque parfois Ctrl+Shift). */
export function handleTextDirectionShortcut(
  e: KeyLike,
  onDirection: (dir: TextDirection) => void,
): boolean {
  const ctrlShift = (e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey;
  const altShift = e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey;
  if (!ctrlShift && !altShift) return false;

  if (isArrow(e.code, e.key, "Right")) {
    e.preventDefault();
    e.stopPropagation();
    onDirection("ltr");
    return true;
  }
  if (isArrow(e.code, e.key, "Left")) {
    e.preventDefault();
    e.stopPropagation();
    onDirection("rtl");
    return true;
  }
  return false;
}

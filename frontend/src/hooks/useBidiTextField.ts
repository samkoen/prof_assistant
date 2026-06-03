import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, RefObject } from "react";
import {
  clearActiveBidiShortcutHandler,
  setActiveBidiShortcutHandler,
} from "../utils/bidiShortcutFocus";
import {
  handleTextDirectionShortcut,
  type TextDirection,
} from "../utils/textDirectionShortcut";

export function useRegisterBidiFocus(
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  onDirection: (dir: TextDirection) => void,
) {
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const onFocus = () => setActiveBidiShortcutHandler(onDirection);
    const onBlur = () => clearActiveBidiShortcutHandler(onDirection);

    el.addEventListener("focus", onFocus);
    el.addEventListener("blur", onBlur);
    if (document.activeElement === el) onFocus();

    return () => {
      el.removeEventListener("focus", onFocus);
      el.removeEventListener("blur", onBlur);
      onBlur();
    };
  }, [inputRef, onDirection]);
}

export function bidiInputSlotProps(
  direction: TextDirection,
  onDirection: (dir: TextDirection) => void,
) {
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    handleTextDirectionShortcut(e, onDirection);
  };
  return {
    input: { onKeyDown },
    htmlInput: { dir: direction, onKeyDown },
  } as const;
}

export function useBidiTextField(defaultDirection: TextDirection = "rtl") {
  const [direction, setDirection] = useState<TextDirection>(defaultDirection);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const onDirection = useCallback((dir: TextDirection) => setDirection(dir), []);
  useRegisterBidiFocus(inputRef, onDirection);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => handleTextDirectionShortcut(e, onDirection),
    [onDirection],
  );

  const slotProps = useMemo(() => bidiInputSlotProps(direction, onDirection), [direction, onDirection]);

  return { direction, setDirection: onDirection, inputRef, onKeyDown, slotProps };
}

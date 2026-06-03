import type { TextDirection } from "./textDirectionShortcut";

type DirectionHandler = (dir: TextDirection) => void;

let activeHandler: DirectionHandler | null = null;

export function setActiveBidiShortcutHandler(handler: DirectionHandler | null): void {
  activeHandler = handler;
}

export function clearActiveBidiShortcutHandler(handler: DirectionHandler): void {
  if (activeHandler === handler) activeHandler = null;
}

export function getActiveBidiShortcutHandler(): DirectionHandler | null {
  return activeHandler;
}

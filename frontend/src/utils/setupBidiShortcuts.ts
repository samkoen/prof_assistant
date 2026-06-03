import { getActiveBidiShortcutHandler } from "./bidiShortcutFocus";
import { handleTextDirectionShortcut } from "./textDirectionShortcut";

const SKIP_INPUT_TYPES = new Set(["email", "password", "number", "tel", "url", "search"]);

export function setupBidiShortcuts(): void {
  document.addEventListener(
    "keydown",
    (e) => {
      const handler = getActiveBidiShortcutHandler();
      if (!handler) return;

      const target = e.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
      if (target.closest('[data-bidi="off"]')) return;
      if (SKIP_INPUT_TYPES.has(target.type)) return;

      handleTextDirectionShortcut(e, handler);
    },
    true,
  );
}

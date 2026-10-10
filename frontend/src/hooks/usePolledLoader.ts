import { useEffect } from "react";

/** Appelle `load` au montage, puis toutes les `intervalMs` ms tant que `enabled` (0 = pas de rafraîchissement). */
export function usePolledLoader(load: () => void | Promise<void>, intervalMs: number, enabled = true): void {
  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;
    const timer = window.setInterval(() => void load(), intervalMs);
    return () => window.clearInterval(timer);
  }, [load, intervalMs, enabled]);
}

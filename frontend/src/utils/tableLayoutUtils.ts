import { TABLE_ACTIONS_COLUMN_PX } from "../constants/layout";

const STORAGE_VERSION = 1;

export function defaultEqualFractions(keys: string[]): Record<string, number> {
  if (!keys.length) return {};
  const n = keys.length;
  return Object.fromEntries(keys.map((k) => [k, 1 / n]));
}

function isValidLoadedPx(px: Record<string, number>, keys: string[]): boolean {
  for (const k of keys) {
    const num = Number(px[k]);
    if (!Number.isFinite(num) || num < 32) return false;
  }
  return true;
}

export function loadColumnWidthsPx(storageKey: string, keys: string[]): Record<string, number> | null {
  if (!keys.length) return null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const j = JSON.parse(raw) as { v?: number; px?: Record<string, number>; order?: string };
    if (j.v !== STORAGE_VERSION || !j.px || j.order !== keys.join(",")) return null;
    if (!isValidLoadedPx(j.px, keys)) return null;
    return { ...j.px };
  } catch {
    return null;
  }
}

export function saveColumnWidthsPx(
  storageKey: string,
  keys: string[],
  px: Record<string, number>
): void {
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ v: STORAGE_VERSION, order: keys.join(","), px })
    );
  } catch {
    /* ignore */
  }
}

function hamiltonToInt(exact: number[], target?: number): number[] {
  if (exact.length === 0) return [];
  const t = target !== undefined && target > 0 ? target : exact.reduce((a, b) => a + b, 0);
  const base = exact.map((x) => Math.floor(x));
  const fr = exact.map((x, i) => x - base[i]);
  let rem = Math.round(t) - base.reduce((a, b) => a + b, 0);
  const byHigh = exact.map((_, i) => i).sort((a, b) => fr[b] - fr[a]);
  for (let r = 0; r < rem; r++) {
    base[byHigh[r % byHigh.length]]++;
  }
  if (rem < 0) {
    const byLow = exact.map((_, i) => i).sort((a, b) => fr[a] - fr[b]);
    let deficit = -rem;
    let i = 0;
    while (deficit > 0 && i < 100) {
      const j = byLow[i % byLow.length];
      if (base[j] > 0) {
        base[j]--;
        deficit--;
      }
      i++;
    }
  }
  return base;
}

export function computeResizablePixelWidths(
  frac: Record<string, number>,
  containerW: number,
  minPx: Record<string, number>,
  resizableOrder: string[],
  actionsPx = TABLE_ACTIONS_COLUMN_PX
) {
  const ro = resizableOrder || [];
  const W = Math.max(200, containerW);
  const A = actionsPx;
  const avail = W - A;
  if (avail < 4 || ro.length === 0) {
    const colWidths = Object.fromEntries(ro.map((k) => [k, minPx[k] ?? 64]));
    const tableMinWidth = ro.reduce((a, k) => a + (minPx[k] ?? 64), 0) + A;
    return { colWidths, actions: A, tableMinWidth, overflow: true };
  }

  const s = ro.reduce((a, k) => a + (frac[k] ?? 0), 0) || 1;
  const f = (k: string) => (frac[k] ?? 0) / s;
  const exactRaw = ro.map((k) => f(k) * avail);
  const withMin = ro.map((k, i) => Math.max(minPx[k] ?? 64, exactRaw[i]));
  const S = withMin.reduce((a, b) => a + b, 0);

  if (S > avail + 0.5) {
    const rounded = withMin.map((x) => Math.round(x));
    const tsum = rounded.reduce((a, b) => a + b, 0) + A;
    return {
      colWidths: Object.fromEntries(ro.map((k, i) => [k, rounded[i]])),
      actions: A,
      tableMinWidth: tsum,
      overflow: true,
    };
  }

  const add = avail - S;
  const spread = withMin.map((v, i) => v + add * f(ro[i]));
  const intParts = hamiltonToInt(spread, avail);
  return {
    colWidths: Object.fromEntries(ro.map((k, i) => [k, intParts[i]])),
    actions: A,
    tableMinWidth: W,
    overflow: false,
  };
}

export function loadVisibleColumnKeys(storageKey: string, defaultKeys: string[]): string[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaultKeys;
    const keys = JSON.parse(raw) as string[];
    if (!Array.isArray(keys) || !keys.length) return defaultKeys;
    const valid = keys.filter((k) => defaultKeys.includes(k));
    return valid.length ? valid : defaultKeys;
  } catch {
    return defaultKeys;
  }
}

export function saveVisibleColumnKeys(storageKey: string, keys: string[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(keys));
  } catch {
    /* ignore */
  }
}

export const JOIN_LINK_VALID_DAY_OPTIONS = [7, 14, 30, 90] as const;
export const DEFAULT_JOIN_LINK_VALID_DAYS = 30;

export function buildJoinCourseUrl(joinToken: string): string {
  const base = window.location.origin;
  return `${base}/join/t/${joinToken}`;
}

export function joinRedirectPath(joinRef: string): string {
  if (/^\d+$/.test(joinRef)) return `/join/${joinRef}`;
  return `/join/t/${joinRef}`;
}

export function authPathWithJoin(mode: "login" | "register", joinRef: string): string {
  if (/^\d+$/.test(joinRef)) return `/${mode}?join=${joinRef}`;
  return `/${mode}?joinToken=${encodeURIComponent(joinRef)}`;
}

/** Extrait le jeton ou l'ancien id depuis une URL / payload QR. */
export function parseJoinTargetFromQrPayload(
  data: string,
): { kind: "token"; token: string } | { kind: "legacyId"; offeringId: number } | null {
  const trimmed = data.trim();
  if (!trimmed) return null;
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "https://local";
    const url = trimmed.startsWith("http") ? new URL(trimmed) : new URL(trimmed, base);
    const tokenMatch = url.pathname.match(/\/join\/t\/([A-Za-z0-9_-]+)/);
    if (tokenMatch) return { kind: "token", token: tokenMatch[1] };
    const idMatch = url.pathname.match(/\/join\/(\d+)/);
    if (idMatch) return { kind: "legacyId", offeringId: Number(idMatch[1]) };
  } catch {
    /* not a URL */
  }
  const tokenPath = trimmed.match(/\/join\/t\/([A-Za-z0-9_-]+)/);
  if (tokenPath) return { kind: "token", token: tokenPath[1] };
  const legacyPath = trimmed.match(/\/join\/(\d+)/);
  if (legacyPath) return { kind: "legacyId", offeringId: Number(legacyPath[1]) };
  if (/^[A-Za-z0-9_-]{16,}$/.test(trimmed)) return { kind: "token", token: trimmed };
  return null;
}

export function formatJoinExpiresAt(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("he-IL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function isJoinLinkExpired(iso: string | null | undefined): boolean {
  if (!iso) return true;
  return Date.now() >= new Date(iso).getTime();
}

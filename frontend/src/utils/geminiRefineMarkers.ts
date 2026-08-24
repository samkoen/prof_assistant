/** Marqueurs des messages refine envoyés à l'IA (anglais + héritage hébreu). */

export const REFINE_USER_MARKERS = [
  "Teacher update request:\n",
  "בקשת עדכון מהמורה:\n",
] as const;

export function isRefineUserContent(content: string): boolean {
  return REFINE_USER_MARKERS.some((marker) => content.includes(marker.trim()));
}

export function displayRefineText(content: string): string {
  for (const marker of REFINE_USER_MARKERS) {
    if (!content.includes(marker)) continue;
    const after = content.split(marker, 2)[1] ?? "";
    return after.split("\n\n")[0].trim();
  }
  return "";
}

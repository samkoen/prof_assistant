import { he } from "../i18n/he";

export function formatHiddenDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return he.integritySeconds(0);
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  if (min > 0) return he.integrityMinutesSeconds(min, sec);
  return he.integritySeconds(sec);
}

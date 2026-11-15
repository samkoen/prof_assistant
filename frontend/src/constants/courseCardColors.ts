/** Teintes discrètes pour l'initiale des cartes (cycle par index). */
export const COURSE_CARD_COLORS = [
  { bg: "#e8eefb", accent: "#2451b3" },
  { bg: "#e6f4f1", accent: "#0f7a63" },
  { bg: "#f3ecfa", accent: "#6b3fa0" },
  { bg: "#fdf1e4", accent: "#a65a00" },
  { bg: "#e7f2f8", accent: "#0e6a8f" },
  { bg: "#f8e9ee", accent: "#a3324f" },
] as const;

export function courseCardColor(index: number) {
  return COURSE_CARD_COLORS[index % COURSE_CARD_COLORS.length];
}

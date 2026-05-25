/** Comme le backend : retire uniquement \\n \\r \\t en bordure, pas les espaces (schémas ASCII). */
export function normalizeTextBlock(text: string): string {
  return text.replace(/^[\n\r\t]+/, "").replace(/[\n\r\t]+$/, "");
}

/**
 * Palette « bleu encre » — sobre, lisible, professionnelle.
 * Une seule couleur d'action (primary600) ; les accents servent uniquement aux états.
 */
export const brand = {
  primary900: "#0f2550",
  primary800: "#163372",
  primary700: "#1c4192",
  primary600: "#2451b3",
  primary500: "#4b73cc",
  primary400: "#93abe2",
  primary100: "#e2e9f8",
  primary50: "#f1f4fb",
  sky500: "#0e7fa8",
  mint500: "#0f8a68",
  amber500: "#c76a05",
  amber400: "#e39a1c",
  slate900: "#111827",
  slate700: "#374151",
  slate600: "#4b5563",
  slate400: "#9ca3af",
  slate200: "#e5e7eb",
  white: "#ffffff",
} as const;

/** Surfaces neutres. */
export const surface = {
  page: "#f5f6f8",
  card: brand.white,
  subtle: "#f9fafb",
  border: "#e4e7ec",
  borderStrong: "#d0d5dd",
  hover: "#f2f4f7",
} as const;

/** Fond de page : uni, neutre. */
export const pageMeshBackground = surface.page;

/** Fond des pages d'authentification : discret, une seule nuance. */
export const authMeshBackground = `linear-gradient(180deg, ${brand.primary50} 0%, ${surface.page} 100%)`;

/** Ancien dégradé de marque : désormais une couleur pleine (titres, logo). */
export const brandTextGradient = `linear-gradient(0deg, ${brand.primary700} 0%, ${brand.primary700} 100%)`;

/** Barre latérale : claire. */
export const sidebarGradient = brand.white;

/** Bandeaux : couleur pleine sobre. */
export const heroGradient = brand.primary700;

export const softCardShadow = "0 1px 2px rgba(16, 24, 40, 0.05)";
export const elevatedCardShadow = "0 12px 32px rgba(16, 24, 40, 0.12), 0 2px 6px rgba(16, 24, 40, 0.06)";

/** Fonds d'icônes / pastilles : couleurs pleines (plus de dégradés). */
export const cardGradients = {
  primary: brand.primary600,
  secondary: brand.sky500,
  warning: brand.amber500,
  success: brand.mint500,
  error: "#c62828",
} as const;

/** Couleurs d'état (texte sur fond clair) — contraste AA. */
export const statusTones = {
  success: { fg: "#067647", bg: "#e7f6ee" },
  warning: { fg: "#a65a00", bg: "#fdf3e1" },
  info: { fg: "#075985", bg: "#e6f2fa" },
  neutral: { fg: "#475467", bg: "#f2f4f7" },
  primary: { fg: brand.primary700, bg: brand.primary100 },
  danger: { fg: "#b42318", bg: "#fdecea" },
} as const;

export type StatusTone = keyof typeof statusTones;

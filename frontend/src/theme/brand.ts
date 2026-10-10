/** Palette EdTech — violet vif et contrasté, accents cyan / ambre / menthe. */
export const brand = {
  violet900: "#2b2170",
  violet800: "#3c2fa0",
  violet700: "#4c38d4",
  violet600: "#5b44e8",
  violet500: "#8271f2",
  violet400: "#b7acfa",
  violet100: "#ebe8ff",
  violet50: "#f5f3ff",
  sky500: "#22b8f0",
  mint500: "#16c79a",
  amber500: "#f59e0b",
  amber400: "#fbbf24",
  slate900: "#0f172a",
  slate700: "#334155",
  slate600: "#475569",
  slate400: "#94a3b8",
  slate200: "#e2e8f0",
  white: "#ffffff",
} as const;

/** Fond page — nuance lavande très claire, halos discrets. */
export const pageMeshBackground = `
  radial-gradient(ellipse 60% 40% at 90% 0%, rgba(91, 68, 232, 0.10) 0%, transparent 60%),
  radial-gradient(ellipse 45% 35% at 0% 100%, rgba(34, 184, 240, 0.08) 0%, transparent 60%),
  linear-gradient(180deg, #f3f1fd 0%, #f7f6fc 55%, #f8fafc 100%)
`;

export const authMeshBackground = `
  radial-gradient(circle 280px at 12% 18%, rgba(91, 68, 232, 0.22) 0%, transparent 70%),
  radial-gradient(circle 320px at 88% 22%, rgba(34, 184, 240, 0.18) 0%, transparent 65%),
  radial-gradient(circle 260px at 75% 88%, rgba(245, 158, 11, 0.12) 0%, transparent 60%),
  radial-gradient(circle 200px at 20% 85%, rgba(22, 199, 154, 0.12) 0%, transparent 60%),
  linear-gradient(160deg, #e8eafc 0%, #f3f0ff 45%, #f8fafc 100%)
`;

/** Dégradé marque (logo / titres). */
export const brandTextGradient = `linear-gradient(100deg, ${brand.violet700} 0%, ${brand.sky500} 45%, ${brand.amber500} 72%, ${brand.mint500} 100%)`;

/** Barre latérale — violet profond, texte clair. */
export const sidebarGradient = `linear-gradient(190deg, ${brand.violet900} 0%, #261c78 55%, #1d1659 100%)`;

/** Bannière d'accueil — violet profond vers cyan. */
export const heroGradient = `linear-gradient(125deg, ${brand.violet900} 0%, ${brand.violet700} 48%, ${brand.violet500} 82%, ${brand.sky500} 130%)`;

export const softCardShadow = `0 2px 12px rgba(43, 33, 112, 0.06), 0 1px 3px rgba(43, 33, 112, 0.05)`;
export const elevatedCardShadow = `0 24px 64px rgba(43, 33, 112, 0.14), 0 8px 24px rgba(43, 33, 112, 0.07)`;

export const cardGradients = {
  primary: `linear-gradient(135deg, ${brand.violet700} 0%, ${brand.violet500} 100%)`,
  secondary: `linear-gradient(135deg, #0e8fbf 0%, ${brand.sky500} 100%)`,
  warning: `linear-gradient(135deg, #d97706 0%, ${brand.amber400} 100%)`,
  success: `linear-gradient(135deg, #0f9f7a 0%, ${brand.mint500} 100%)`,
  error: `linear-gradient(135deg, #dc2626 0%, #f87171 100%)`,
} as const;

/** Couleurs d'état (texte sur fond clair) — contraste AA. */
export const statusTones = {
  success: { fg: "#047857", bg: "#d1fae5" },
  warning: { fg: "#b45309", bg: "#fef3c7" },
  info: { fg: "#0369a1", bg: "#e0f2fe" },
  neutral: { fg: "#475569", bg: "#eef2f7" },
  violet: { fg: brand.violet700, bg: brand.violet100 },
  danger: { fg: "#b91c1c", bg: "#fee2e2" },
} as const;

export type StatusTone = keyof typeof statusTones;

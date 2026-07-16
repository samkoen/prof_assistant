/** Palette EdTech douce — inspirée d’une UI claire type GEAI. */
export const brand = {
  violet900: "#3d3568",
  violet800: "#524a82",
  violet700: "#6d5dce",
  violet600: "#7c6fd4",
  violet500: "#9b8fe0",
  violet400: "#c4bdf0",
  violet100: "#ede9fe",
  violet50: "#f5f3ff",
  sky500: "#38bdf8",
  mint500: "#34d399",
  amber500: "#e8a84a",
  amber400: "#f0c078",
  slate900: "#0f172a",
  slate600: "#64748b",
  slate400: "#94a3b8",
  white: "#ffffff",
} as const;

/** Fond page — orbes lavande / cyan légers. */
export const pageMeshBackground = `
  radial-gradient(ellipse 70% 55% at 15% 10%, rgba(124, 111, 212, 0.18) 0%, transparent 55%),
  radial-gradient(ellipse 55% 45% at 90% 20%, rgba(56, 189, 248, 0.14) 0%, transparent 50%),
  radial-gradient(ellipse 50% 40% at 70% 95%, rgba(52, 211, 153, 0.1) 0%, transparent 45%),
  linear-gradient(165deg, #eef0ff 0%, #f7f5ff 42%, #f8fafc 100%)
`;

export const authMeshBackground = `
  radial-gradient(circle 280px at 12% 18%, rgba(124, 111, 212, 0.22) 0%, transparent 70%),
  radial-gradient(circle 320px at 88% 22%, rgba(56, 189, 248, 0.18) 0%, transparent 65%),
  radial-gradient(circle 260px at 75% 88%, rgba(232, 168, 74, 0.12) 0%, transparent 60%),
  radial-gradient(circle 200px at 20% 85%, rgba(52, 211, 153, 0.12) 0%, transparent 60%),
  linear-gradient(160deg, #e8eafc 0%, #f3f0ff 45%, #f8fafc 100%)
`;

/** Dégradé marque (logo / titres). */
export const brandTextGradient = `linear-gradient(100deg, ${brand.violet700} 0%, ${brand.sky500} 45%, ${brand.amber500} 72%, ${brand.mint500} 100%)`;

export const sidebarGradient = `linear-gradient(180deg, ${brand.white} 0%, ${brand.violet50} 100%)`;

/** Bannière — violet doux, pas saturé. */
export const heroGradient = `linear-gradient(125deg, ${brand.violet800} 0%, ${brand.violet600} 50%, ${brand.sky500} 100%)`;

export const softCardShadow = `0 4px 24px rgba(61, 53, 104, 0.06), 0 1px 3px rgba(61, 53, 104, 0.04)`;
export const elevatedCardShadow = `0 24px 64px rgba(61, 53, 104, 0.12), 0 8px 24px rgba(61, 53, 104, 0.06)`;

export const cardGradients = {
  primary: `linear-gradient(135deg, ${brand.violet700} 0%, ${brand.violet500} 100%)`,
  secondary: `linear-gradient(135deg, #5a8f96 0%, #7eb8c4 100%)`,
  warning: `linear-gradient(135deg, #b8893a 0%, ${brand.amber400} 100%)`,
  success: `linear-gradient(135deg, #3d8b6e 0%, #6bc49a 100%)`,
  error: `linear-gradient(135deg, #b85c5c 0%, #e09090 100%)`,
} as const;

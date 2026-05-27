/** Violet adouci — même style qu’avant, teintes plus légères. */
export const brand = {
  violet900: "#3d3568",
  violet800: "#524a82",
  violet700: "#6d5dce",
  violet600: "#8b7fd4",
  violet500: "#a89ee8",
  violet400: "#c4bdf0",
  violet100: "#ede9fe",
  violet50: "#f7f5ff",
  amber500: "#e8a84a",
  amber400: "#f0c078",
  slate900: "#0f172a",
  slate600: "#64748b",
  white: "#ffffff",
} as const;

export const sidebarGradient = `linear-gradient(180deg, ${brand.violet900} 0%, ${brand.violet800} 55%, ${brand.violet700} 100%)`;

export const pageMeshBackground = `
  radial-gradient(ellipse 80% 50% at 90% 0%, rgba(139, 127, 212, 0.12) 0%, transparent 55%),
  radial-gradient(ellipse 60% 40% at 10% 100%, rgba(232, 168, 74, 0.06) 0%, transparent 50%),
  linear-gradient(180deg, ${brand.violet50} 0%, #faf9ff 40%, #f8fafc 100%)
`;

/** Bannière — violet clair, sans orange criard. */
export const heroGradient = `linear-gradient(125deg, ${brand.violet800} 0%, ${brand.violet600} 55%, ${brand.violet500} 100%)`;

export const cardGradients = {
  primary: `linear-gradient(135deg, ${brand.violet700} 0%, ${brand.violet500} 100%)`,
  secondary: `linear-gradient(135deg, #5a8f96 0%, #7eb8c4 100%)`,
  warning: `linear-gradient(135deg, #b8893a 0%, ${brand.amber400} 100%)`,
  success: `linear-gradient(135deg, #3d8b6e 0%, #6bc49a 100%)`,
  error: `linear-gradient(135deg, #b85c5c 0%, #e09090 100%)`,
} as const;

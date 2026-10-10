import { Box, type SxProps, type Theme } from "@mui/material";
import BrandSpinner from "./BrandSpinner";
import { brand } from "../../theme/brand";
import { he } from "../../i18n/he";
import { dotSize, spinnerVariant } from "../../utils/brandSpinner";

export type SpinnerProps = {
  /** Taille en px (40 par défaut, comme CircularProgress). */
  size?: number;
  /** `inherit` : points à la couleur du texte (boutons) ; sinon couleurs de la marque. */
  color?: "inherit" | "primary";
  sx?: SxProps<Theme>;
  "aria-hidden"?: boolean;
};

const dotKeyframes = {
  "@keyframes spinnerDot": {
    "0%, 80%, 100%": { transform: "translateY(0) scale(0.7)", opacity: 0.55 },
    "40%": { transform: "translateY(-38%) scale(1)", opacity: 1 },
  },
  "@media (prefers-reduced-motion: reduce)": { "& span": { animationDuration: "4s !important" } },
} as const;

const BRAND_DOTS = [brand.violet600, brand.sky500, brand.amber500];

function Dots({ size, color, sx, hidden }: { size: number; color: "inherit" | "primary"; sx?: SxProps<Theme>; hidden?: boolean }) {
  const d = dotSize(size);
  return (
    <Box
      role={hidden ? undefined : "progressbar"}
      aria-label={hidden ? undefined : he.loading}
      aria-hidden={hidden}
      sx={[
        { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: `${Math.max(2, Math.round(d * 0.3))}px`, width: size, height: size, flexShrink: 0, ...dotKeyframes },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {BRAND_DOTS.map((c, i) => (
        <Box
          component="span"
          key={c}
          sx={{ width: d, height: d, borderRadius: "50%", bgcolor: color === "inherit" ? "currentColor" : c, animation: `spinnerDot 1s ease-in-out ${i * 0.14}s infinite` }}
        />
      ))}
    </Box>
  );
}

/** Spinner du système : « orbite » en grand format, trois points rebondissants en compact (boutons, icônes). */
export default function Spinner({ size = 40, color = "primary", sx, "aria-hidden": hidden }: SpinnerProps) {
  if (spinnerVariant(size) === "dots") return <Dots size={size} color={color} sx={sx} hidden={hidden} />;
  return (
    <Box sx={[{ display: "inline-flex" }, ...(Array.isArray(sx) ? sx : [sx])]} aria-hidden={hidden}>
      <BrandSpinner size={size} />
    </Box>
  );
}

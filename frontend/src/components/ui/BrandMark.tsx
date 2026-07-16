import { alpha, Box, Typography } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { he } from "../../i18n/he";
import { brand, brandTextGradient } from "../../theme/brand";

type BrandMarkProps = {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  inverted?: boolean;
  align?: "center" | "start";
};

const sizeMap = {
  sm: { icon: 28, title: "1.15rem", gap: 1 },
  md: { icon: 40, title: "1.65rem", gap: 1.25 },
  lg: { icon: 52, title: "2.1rem", gap: 1.5 },
} as const;

export default function BrandMark({
  size = "md",
  showTagline = false,
  inverted = false,
  align = "center",
}: BrandMarkProps) {
  const s = sizeMap[size];
  const centered = align === "center";

  return (
    <Box
      dir="rtl"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: centered ? "center" : "flex-start",
        textAlign: centered ? "center" : "right",
        gap: showTagline ? 1 : 0,
        minWidth: 0,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: s.gap, minWidth: 0 }}>
        <Box
          sx={{
            width: s.icon,
            height: s.icon,
            borderRadius: "50%",
            background: brandTextGradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 6px 20px ${alpha(brand.violet600, 0.28)}`,
            flexShrink: 0,
          }}
        >
          <AutoAwesomeIcon sx={{ fontSize: s.icon * 0.55, color: brand.white }} />
        </Box>
        <Typography
          component="span"
          sx={{
            fontSize: s.title,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            background: inverted ? "none" : brandTextGradient,
            color: inverted ? brand.white : undefined,
            WebkitBackgroundClip: inverted ? undefined : "text",
            WebkitTextFillColor: inverted ? undefined : "transparent",
            backgroundClip: inverted ? undefined : "text",
          }}
        >
          {he.appName}
        </Typography>
      </Box>
      {showTagline && (
        <Typography
          variant="caption"
          sx={{
            color: inverted ? alpha(brand.white, 0.75) : brand.slate400,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontSize: size === "lg" ? "0.72rem" : "0.65rem",
          }}
        >
          {he.authBrandTagline}
        </Typography>
      )}
    </Box>
  );
}

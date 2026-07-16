import type { ReactNode } from "react";
import { alpha, Box, Typography } from "@mui/material";
import BrandMark from "./BrandMark";
import { he } from "../../i18n/he";
import { authMeshBackground, brand, elevatedCardShadow } from "../../theme/brand";

type AuthLayoutProps = {
  title: string;
  children: ReactNode;
};

function AuthOrb({
  size,
  top,
  left,
  right,
  bottom,
  color,
}: {
  size: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  color: string;
}) {
  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        bgcolor: color,
        filter: "blur(2px)",
        top,
        left,
        right,
        bottom,
        pointerEvents: "none",
      }}
    />
  );
}

export default function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, sm: 3 },
        background: authMeshBackground,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <AuthOrb size={220} top="-40px" left="-60px" color={alpha(brand.violet400, 0.35)} />
      <AuthOrb size={180} top="12%" right="-40px" color={alpha(brand.sky500, 0.2)} />
      <AuthOrb size={160} bottom="8%" left="8%" color={alpha(brand.mint500, 0.18)} />
      <AuthOrb size={120} bottom="-20px" right="18%" color={alpha(brand.amber400, 0.22)} />

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 460,
          bgcolor: brand.white,
          borderRadius: { xs: 4, sm: 5 },
          boxShadow: elevatedCardShadow,
          border: `1px solid ${alpha(brand.violet400, 0.18)}`,
          px: { xs: 3, sm: 4.5 },
          py: { xs: 3.5, sm: 4.5 },
        }}
      >
        <Box sx={{ mb: 3.5, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <BrandMark size="lg" showTagline />
          <Typography
            variant="body1"
            sx={{
              color: brand.slate600,
              textAlign: "center",
              maxWidth: 320,
              lineHeight: 1.65,
              fontSize: "0.95rem",
            }}
          >
            {he.platformSubtitle}
          </Typography>
        </Box>

        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ mb: 2.5, textAlign: "center", color: brand.slate900 }}
        >
          {title}
        </Typography>

        {children}
      </Box>
    </Box>
  );
}

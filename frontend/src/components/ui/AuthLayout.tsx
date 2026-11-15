import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import BrandMark from "./BrandMark";
import { he } from "../../i18n/he";
import { authMeshBackground, brand, elevatedCardShadow, surface } from "../../theme/brand";

type AuthLayoutProps = {
  title: string;
  children: ReactNode;
};


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

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 460,
          bgcolor: brand.white,
          borderRadius: { xs: 3, sm: 3.5 },
          boxShadow: elevatedCardShadow,
          border: `1px solid ${surface.border}`,
          px: { xs: 3, sm: 4.5 },
          py: { xs: 3.5, sm: 4.5 },
        }}
      >
        <Box sx={{ mb: 3.5, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <BrandMark size="md" />
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

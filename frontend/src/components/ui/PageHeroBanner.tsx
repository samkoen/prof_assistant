import type { ReactNode } from "react";
import { alpha, Box, Typography } from "@mui/material";
import { brand, heroGradient } from "../../theme/brand";
import { hebrewPageToolbarSx, hebrewToolbarActionsSx, hebrewToolbarTitleSx } from "../../styles/hebrewAlign";

type PageHeroBannerProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export default function PageHeroBanner({ title, subtitle, actions }: PageHeroBannerProps) {
  return (
    <Box
      sx={{
        mb: 3,
        p: { xs: 2.5, sm: 3.5 },
        borderRadius: 4,
        background: heroGradient,
        color: brand.white,
        position: "relative",
        overflow: "hidden",
        boxShadow: `0 8px 32px ${alpha(brand.violet700, 0.22)}`,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          width: 240,
          height: 240,
          borderRadius: "50%",
          bgcolor: alpha("#fff", 0.1),
          top: -80,
          left: -50,
        }}
      />
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          ...hebrewPageToolbarSx,
          mb: 0,
          alignItems: "flex-start",
        }}
      >
        <Box sx={hebrewToolbarTitleSx}>
          <Typography variant="h4" fontWeight={800} sx={{ color: "#fff", mb: subtitle ? 0.75 : 0 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" sx={{ color: alpha("#fff", 0.92), maxWidth: 560, lineHeight: 1.6 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && <Box sx={hebrewToolbarActionsSx}>{actions}</Box>}
      </Box>
    </Box>
  );
}

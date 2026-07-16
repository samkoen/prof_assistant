import type { ReactNode } from "react";
import { alpha, Box, Typography } from "@mui/material";
import { hebrewPageToolbarSx, hebrewToolbarActionsSx, hebrewToolbarTitleSx } from "../../styles/hebrewAlign";
import { brand, brandTextGradient } from "../../theme/brand";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <Box
      sx={{
        ...hebrewPageToolbarSx,
        pb: 2.5,
        mb: 3,
        borderBottom: `1px solid ${alpha(brand.violet600, 0.1)}`,
      }}
    >
      <Box sx={hebrewToolbarTitleSx}>
        <Typography
          variant="h4"
          sx={{
            background: brandTextGradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75, maxWidth: 640, lineHeight: 1.65 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && <Box sx={hebrewToolbarActionsSx}>{actions}</Box>}
    </Box>
  );
}

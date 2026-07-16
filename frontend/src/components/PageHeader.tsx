import type { ReactNode } from "react";
import { alpha, Box, Typography } from "@mui/material";
import { hebrewPageToolbarSx, hebrewToolbarActionsSx, hebrewToolbarTitleSx } from "../styles/hebrewAlign";
import { brand, brandTextGradient } from "../theme/brand";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <Box
      sx={{
        ...hebrewPageToolbarSx,
        pb: 2.5,
        borderBottom: `1px solid ${alpha(brand.violet600, 0.1)}`,
      }}
    >
      <Box sx={hebrewToolbarTitleSx}>
        <Typography
          variant="h4"
          fontWeight={800}
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
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box sx={hebrewToolbarActionsSx}>{action}</Box>}
    </Box>
  );
}

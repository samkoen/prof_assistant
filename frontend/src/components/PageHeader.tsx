import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { hebrewPageToolbarSx, hebrewToolbarActionsSx, hebrewToolbarTitleSx } from "../styles/hebrewAlign";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <Box sx={hebrewPageToolbarSx}>
      <Box sx={hebrewToolbarTitleSx}>
        <Typography variant="h4" fontWeight={700}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box sx={hebrewToolbarActionsSx}>{action}</Box>}
    </Box>
  );
}

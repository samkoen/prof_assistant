import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { hebrewAlignRightSx, hebrewPageToolbarSx } from "../styles/hebrewAlign";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <Box sx={{ ...hebrewPageToolbarSx, mb: 3 }}>
      {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
      <Box sx={{ ...hebrewAlignRightSx, flex: 1, minWidth: 0 }}>
        <Typography variant="h4" fontWeight={700}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

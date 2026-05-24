import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        mb: 3,
        width: "100%",
        maxWidth: "100%",
      }}
    >
      <Box sx={{ flex: "1 1 200px", minWidth: 0 }}>
        <Typography variant="h4" fontWeight={700} noWrap={false}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && (
        <Box sx={{ flexShrink: 0, display: "flex", justifyContent: "flex-start" }}>{action}</Box>
      )}
    </Box>
  );
}

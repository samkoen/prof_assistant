import type { ReactNode } from "react";
import { Box, Typography, useTheme } from "@mui/material";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        mb: 3,
        pb: 2.5,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.primary.dark} 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75, maxWidth: 640 }}>
          {subtitle}
        </Typography>
      )}
      {actions && (
        <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1.5 }}>{actions}</Box>
      )}
    </Box>
  );
}

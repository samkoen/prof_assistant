import type { ReactNode } from "react";
import { alpha, Box, Card, CardContent, Typography } from "@mui/material";
import { brand, cardGradients } from "../../theme/brand";

type HighlightCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  footer: ReactNode;
  accent?: keyof typeof cardGradients;
  highlighted?: boolean;
};

export default function HighlightCard({
  icon,
  title,
  description,
  footer,
  accent = "primary",
  highlighted = false,
}: HighlightCardProps) {
  const gradient = cardGradients[accent];

  return (
    <Card
      sx={{
        height: "100%",
        border: highlighted ? `2px solid ${brand.amber400}` : `1px solid ${alpha(brand.violet500, 0.2)}`,
        boxShadow: highlighted
          ? `0 0 0 3px ${alpha(brand.amber500, 0.2)}, 0 8px 28px ${alpha(brand.violet700, 0.12)}`
          : `0 4px 20px ${alpha(brand.violet600, 0.1)}`,
        overflow: "hidden",
      }}
    >
      <Box sx={{ height: 5, background: gradient }} />
      <CardContent sx={{ p: 2.5, height: "calc(100% - 5px)", display: "flex", flexDirection: "column" }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            background: gradient,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 1.5,
            "& .MuiSvgIcon-root": { fontSize: 26 },
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1 }}>
          {description}
        </Typography>
        {footer}
      </CardContent>
    </Card>
  );
}

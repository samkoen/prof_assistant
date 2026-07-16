import type { ReactNode } from "react";
import { alpha, Box, Card, CardContent, Typography } from "@mui/material";
import { brand, cardGradients, softCardShadow } from "../../theme/brand";

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
        border: highlighted
          ? `2px solid ${brand.amber400}`
          : `1px solid ${alpha(brand.violet500, 0.14)}`,
        boxShadow: highlighted
          ? `0 0 0 3px ${alpha(brand.amber500, 0.16)}, 0 12px 32px ${alpha(brand.violet700, 0.1)}`
          : softCardShadow,
        overflow: "hidden",
      }}
    >
      <Box sx={{ height: 4, background: gradient }} />
      <CardContent sx={{ p: 2.75, height: "calc(100% - 4px)", display: "flex", flexDirection: "column" }}>
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
            mb: 1.75,
            boxShadow: `0 6px 16px ${alpha(brand.violet900, 0.14)}`,
            "& .MuiSvgIcon-root": { fontSize: 26 },
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1, lineHeight: 1.6 }}>
          {description}
        </Typography>
        {footer}
      </CardContent>
    </Card>
  );
}

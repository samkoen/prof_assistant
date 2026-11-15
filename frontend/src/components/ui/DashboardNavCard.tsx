import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { alpha, Box, Card, CardContent, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { brand, cardGradients, softCardShadow } from "../../theme/brand";

type DashboardNavCardProps = {
  to: string;
  title: string;
  description: string;
  icon: ReactNode;
  accent?: keyof typeof cardGradients;
};

export default function DashboardNavCard({
  to,
  title,
  description,
  icon,
  accent = "primary",
}: DashboardNavCardProps) {
  const gradient = cardGradients[accent];

  return (
    <Card
      component={Link}
      to={to}
      sx={{
        textDecoration: "none",
        height: "100%",
        display: "block",
        bgcolor: brand.white,
        
        boxShadow: softCardShadow,
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        "&:hover": {
          borderColor: brand.primary400,
          boxShadow: `0 4px 12px ${alpha(brand.primary900, 0.08)}`,
          "& .nav-card-arrow": { opacity: 1 },
        },
      }}
    >
      <CardContent sx={{ p: 2.75, minHeight: 150 }}>
        <Box
          className="nav-card-icon"
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            mb: 1.75,
            background: gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "& .MuiSvgIcon-root": { fontSize: 24, color: "#fff" },
          }}
        >
          {icon}
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: brand.slate900, mb: 0.75 }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ color: brand.slate600, lineHeight: 1.6 }}>
              {description}
            </Typography>
          </Box>
          <ChevronLeftIcon
            className="nav-card-arrow"
            sx={{
              opacity: 0.4,
              color: brand.primary600,
              fontSize: 26,
              transition: "opacity 0.2s ease, transform 0.2s ease",
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

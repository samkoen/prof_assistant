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
        border: `1px solid ${alpha(brand.violet600, 0.12)}`,
        boxShadow: softCardShadow,
        transition: "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          borderColor: alpha(brand.violet600, 0.28),
          boxShadow: `0 16px 40px ${alpha(brand.violet900, 0.12)}`,
          "& .nav-card-arrow": { opacity: 1, transform: "translateX(-3px)" },
          "& .nav-card-icon": { transform: "scale(1.05)" },
        },
      }}
    >
      <CardContent sx={{ p: 2.75, minHeight: 168 }}>
        <Box
          className="nav-card-icon"
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2.5,
            mb: 2,
            background: gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 8px 20px ${alpha(brand.violet900, 0.16)}`,
            transition: "transform 0.22s ease",
            "& .MuiSvgIcon-root": { fontSize: 28, color: "#fff" },
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
              color: brand.violet600,
              fontSize: 26,
              transition: "opacity 0.2s ease, transform 0.2s ease",
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

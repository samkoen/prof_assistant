import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { alpha, Box, Card, CardContent, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { brand, cardGradients } from "../../theme/brand";

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
        background: gradient,
        border: "none",
        color: brand.white,
        boxShadow: `0 8px 24px ${alpha(brand.violet900, 0.18)}`,
        transition: "transform 0.22s ease, box-shadow 0.22s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 12px 32px ${alpha(brand.violet900, 0.22)}`,
          "& .nav-card-arrow": { opacity: 1 },
        },
      }}
    >
      <CardContent sx={{ p: 2.5, minHeight: 160 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2.5,
            mb: 2,
            bgcolor: alpha("#fff", 0.22),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "& .MuiSvgIcon-root": { fontSize: 30, color: "#fff" },
          }}
        >
          {icon}
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: "#fff", mb: 0.75 }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ color: alpha("#fff", 0.9), lineHeight: 1.55 }}>
              {description}
            </Typography>
          </Box>
          <ChevronLeftIcon className="nav-card-arrow" sx={{ opacity: 0.55, color: "#fff", fontSize: 26 }} />
        </Box>
      </CardContent>
    </Card>
  );
}

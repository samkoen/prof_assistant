import type { ReactNode } from "react";
import { alpha, Box, Card, CardContent, Typography } from "@mui/material";
import QuizIcon from "@mui/icons-material/Quiz";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SpeedIcon from "@mui/icons-material/Speed";
import { he } from "../../i18n/he";
import { brand, heroGradient } from "../../theme/brand";

type AuthLayoutProps = {
  title: string;
  children: ReactNode;
};

const heroIcons = [QuizIcon, AutoAwesomeIcon, SpeedIcon];

function AuthHero() {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        p: { xs: 4, md: 6, lg: 8 },
        color: brand.white,
        background: heroGradient,
        position: "relative",
        overflow: "hidden",
        minHeight: { xs: 220, md: "auto" },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          bgcolor: alpha("#fff", 0.12),
          top: -120,
          left: -100,
        }}
      />
      <Box sx={{ position: "relative", zIndex: 1, maxWidth: 440 }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 0.75,
            mb: 2,
            borderRadius: 99,
            bgcolor: alpha("#fff", 0.2),
            border: `1px solid ${alpha("#fff", 0.35)}`,
          }}
        >
          <QuizIcon fontSize="small" />
          <Typography variant="body2" fontWeight={700}>
            {he.appName}
          </Typography>
        </Box>
        <Typography variant="h3" fontWeight={800} sx={{ mb: 1.5, lineHeight: 1.15, fontSize: { xs: "1.75rem", md: "2.5rem" } }}>
          {he.authHeroTitle}
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95, mb: 3, lineHeight: 1.7, fontSize: "1.05rem" }}>
          {he.platformSubtitle}
        </Typography>
        {he.authHeroPoints.map((point, i) => {
          const Icon = heroIcons[i % heroIcons.length];
          return (
            <Box key={point} display="flex" alignItems="center" gap={1.5} sx={{ mb: 1.25 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: alpha("#fff", 0.2),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon />
              </Box>
              <Typography variant="body1" fontWeight={600}>
                {point}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <Box dir="rtl" sx={{ minHeight: "100vh", display: "flex", flexDirection: { xs: "column", md: "row" } }}>
      <AuthHero />
      <Box
        sx={{
          flex: { xs: "1", md: "0 0 440px" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2, sm: 4 },
          bgcolor: brand.violet50,
        }}
      >
        <Card
          sx={{
            width: "100%",
            maxWidth: 400,
            border: `1px solid ${alpha(brand.violet500, 0.2)}`,
            boxShadow: `0 12px 40px ${alpha(brand.violet700, 0.12)}`,
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography
              variant="overline"
              sx={{ color: brand.violet600, fontWeight: 700, letterSpacing: 1 }}
            >
              {he.appName}
            </Typography>
            <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: brand.violet800 }}>
              {title}
            </Typography>
            {children}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

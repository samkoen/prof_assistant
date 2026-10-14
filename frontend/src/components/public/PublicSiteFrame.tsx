import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Link, Stack } from "@mui/material";
import BrandMark from "../ui/BrandMark";
import { he } from "../../i18n/he";
import { pageMeshBackground } from "../../theme/brand";

const footerLinks = [
  { to: "/terms", label: he.publicHome.termsTitle },
  { to: "/privacy", label: he.publicHome.privacyTitle },
  { to: "/contact-us", label: he.contactTitle },
] as const;

export default function PublicSiteFrame({ children }: { children: ReactNode }) {
  return (
    <Box dir="rtl" sx={{ minHeight: "100vh", background: pageMeshBackground }}>
      <PublicHeader />
      <Box component="main" sx={{ maxWidth: 1040, mx: "auto", px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 5 } }}>
        {children}
      </Box>
      <PublicFooter />
    </Box>
  );
}

function PublicHeader() {
  return (
    <Stack
      direction="row"
      sx={{ alignItems: "center", justifyContent: "space-between", px: { xs: 2, sm: 3 }, py: 2, gap: 2 }}
    >
      <BrandMark size="sm" align="start" />
      <Stack direction="row" sx={{ gap: 1 }}>
        <Button component={RouterLink} to="/login" variant="text">{he.login}</Button>
        <Button component={RouterLink} to="/register" variant="contained">{he.register}</Button>
      </Stack>
    </Stack>
  );
}

function PublicFooter() {
  return (
    <Stack
      component="footer"
      direction="row"
      sx={{ justifyContent: "center", gap: 3, flexWrap: "wrap", px: 2, pb: 4 }}
    >
      {footerLinks.map((item) => (
        <Link key={item.to} component={RouterLink} to={item.to} color="text.secondary" underline="hover">
          {item.label}
        </Link>
      ))}
    </Stack>
  );
}

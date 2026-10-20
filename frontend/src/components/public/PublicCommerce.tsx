import { Link as RouterLink } from "react-router-dom";
import { Box, Link, Stack, Typography } from "@mui/material";
import { usePublicCatalog } from "../../hooks/usePublicCatalog";
import { he } from "../../i18n/he";
import PublicPackPurchase from "./PublicPackPurchase";

export default function PublicCommerce() {
  const packs = usePublicCatalog();
  return (
    <Box sx={{ my: { xs: 4, sm: 6 } }}>
      <PublicPackPurchase packs={packs} />
      <InfoBlock title={he.publicHome.paymentTitle} text={he.publicHome.paymentBody} />
      <LegalLinks />
    </Box>
  );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <Box component="section" sx={{ mt: 4 }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>{title}</Typography>
      <Typography sx={{ maxWidth: 720, lineHeight: 1.75 }}>{text}</Typography>
    </Box>
  );
}

function LegalLinks() {
  return (
    <Box component="section" sx={{ mt: 4 }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>{he.publicHome.legalTitle}</Typography>
      <Typography color="text.secondary" sx={{ mb: 1.5 }}>{he.publicHome.legalLead}</Typography>
      <Stack direction="row" sx={{ gap: 3 }}>
        <Link component={RouterLink} to="/terms" fontWeight={700}>{he.publicHome.termsTitle}</Link>
        <Link component={RouterLink} to="/privacy" fontWeight={700}>{he.publicHome.privacyTitle}</Link>
      </Stack>
    </Box>
  );
}

import { Link as RouterLink } from "react-router-dom";
import { Box, Link, Stack, Typography } from "@mui/material";
import PackLabel from "../billing/PackLabel";
import { usePublicCatalog } from "../../hooks/usePublicCatalog";
import { he } from "../../i18n/he";
import { brand, softCardShadow } from "../../theme/brand";
import { STUDENT_AI_PRODUCT, TEACHER_AI_PRODUCT, type AiCreditPack } from "../../utils/aiCredits";
import { packsForProduct } from "../../utils/publicCatalog";

export default function PublicCommerce() {
  const packs = usePublicCatalog();
  return (
    <Box sx={{ my: { xs: 4, sm: 6 } }}>
      <PriceList packs={packs} />
      <InfoBlock title={he.publicHome.paymentTitle} text={he.publicHome.paymentBody} />
      <LegalLinks />
    </Box>
  );
}

function PriceList({ packs }: { packs: AiCreditPack[] }) {
  return (
    <Box component="section">
      <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>{he.publicHome.pricesTitle}</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>{he.publicHome.pricesLead}</Typography>
      <Stack sx={{ gap: 2 }}>
        <PackGroup title={he.publicHome.studentPacksTitle} packs={packsForProduct(packs, STUDENT_AI_PRODUCT)} />
        <PackGroup title={he.publicHome.teacherPacksTitle} packs={packsForProduct(packs, TEACHER_AI_PRODUCT)} />
      </Stack>
    </Box>
  );
}

function PackGroup({ title, packs }: { title: string; packs: AiCreditPack[] }) {
  return (
    <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: brand.white, boxShadow: softCardShadow }}>
      <Typography fontWeight={800} sx={{ mb: 1 }}>{title}</Typography>
      <Stack component="ul" sx={{ m: 0, p: 0, listStyle: "none", gap: 0.75 }}>
        {packs.map((pack) => (
          <Typography key={pack.code} component="li"><PackLabel pack={pack} /></Typography>
        ))}
      </Stack>
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

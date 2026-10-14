import { Box, Typography } from "@mui/material";
import PublicSiteFrame from "../components/public/PublicSiteFrame";
import { he } from "../i18n/he";

type LegalKind = "terms" | "privacy";

export default function PublicLegalPage({ kind }: { kind: LegalKind }) {
  const page = kind === "terms" ? he.publicHome.terms : he.publicHome.privacy;
  const title = kind === "terms" ? he.publicHome.termsTitle : he.publicHome.privacyTitle;

  return (
    <PublicSiteFrame>
      <Typography variant="h3" fontWeight={800} sx={{ mb: 3 }}>{title}</Typography>
      {page.map((section) => (
        <LegalSection key={section.title} title={section.title} body={section.body} />
      ))}
    </PublicSiteFrame>
  );
}

function LegalSection({ title, body }: { title: string; body: string }) {
  return (
    <Box component="section" sx={{ mb: 3, maxWidth: 760 }}>
      <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>{title}</Typography>
      <Typography sx={{ lineHeight: 1.75 }}>{body}</Typography>
    </Box>
  );
}

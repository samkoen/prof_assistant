import { Link as RouterLink } from "react-router-dom";
import { Box, Link, Stack, Typography } from "@mui/material";
import { he } from "../../i18n/he";
import { brand, softCardShadow } from "../../theme/brand";
import { BUSINESS_ADDRESS, BUSINESS_EMAIL, BUSINESS_PHONE, businessContactLines, contactHref, type ContactKind } from "../../utils/publicSite";

const labels: Record<ContactKind, string> = {
  address: he.publicHome.addressLabel,
  phone: he.publicHome.phoneLabel,
  email: he.publicHome.emailLabel,
};

export default function BusinessDetails() {
  const lines = businessContactLines({
    email: BUSINESS_EMAIL,
    phone: BUSINESS_PHONE,
    address: BUSINESS_ADDRESS,
  });

  return (
    <Box component="section" sx={{ mt: { xs: 4, sm: 6 } }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>{he.publicHome.businessTitle}</Typography>
      <Stack sx={{ p: 2.5, borderRadius: 3, bgcolor: brand.white, boxShadow: softCardShadow, gap: 1.25 }}>
        {lines.map((line) => (
          <ContactLine key={line.kind} kind={line.kind} value={line.value} />
        ))}
        <Link component={RouterLink} to="/contact-us" fontWeight={700}>{he.contactTitle}</Link>
      </Stack>
    </Box>
  );
}

function ContactLine({ kind, value }: { kind: ContactKind; value: string }) {
  const href = contactHref(kind, value);
  const text = href ? <Link href={href} dir="ltr">{value}</Link> : value;
  return (
    <Typography>
      <Box component="span" sx={{ fontWeight: 700 }}>{labels[kind]}: </Box>
      {text}
    </Typography>
  );
}

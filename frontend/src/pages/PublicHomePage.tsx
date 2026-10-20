import { Box, Typography } from "@mui/material";
import BusinessDetails from "../components/public/BusinessDetails";
import OfferGrid from "../components/public/OfferGrid";
import ProductDemo from "../components/public/ProductDemo";
import PublicCommerce from "../components/public/PublicCommerce";
import PublicSiteFrame from "../components/public/PublicSiteFrame";
import { he } from "../i18n/he";
import { brand } from "../theme/brand";

export default function PublicHomePage() {
  return (
    <PublicSiteFrame>
      <HomeLead />
      <OfferGrid />
      <PublicCommerce />
      <BusinessDetails />
      <ProductDemo />
    </PublicSiteFrame>
  );
}

function HomeLead() {
  return (
    <Box component="header">
      <Typography sx={{ color: brand.violet700, fontWeight: 700, mb: 1 }}>{he.publicHome.eyebrow}</Typography>
      <Typography variant="h3" fontWeight={800} sx={{ mb: 2, fontSize: { xs: "2rem", sm: "2.6rem" } }}>
        {he.publicHome.title}
      </Typography>
      <Typography sx={{ maxWidth: 720, color: brand.slate700, fontSize: "1.05rem", lineHeight: 1.7 }}>
        {he.publicHome.lead}
      </Typography>
    </Box>
  );
}

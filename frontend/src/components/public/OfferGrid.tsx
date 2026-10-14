import { Box, Typography } from "@mui/material";
import { he } from "../../i18n/he";
import { brand, softCardShadow } from "../../theme/brand";
import { publicOffers } from "../../utils/publicSite";

export default function OfferGrid() {
  return (
    <Box component="section" sx={{ my: { xs: 4, sm: 6 } }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>{he.publicHome.offersTitle}</Typography>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
        {publicOffers().map((offer) => (
          <OfferCard key={offer.id} title={offer.title} text={offer.text} />
        ))}
      </Box>
    </Box>
  );
}

function OfferCard({ title, text }: { title: string; text: string }) {
  return (
    <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: brand.white, boxShadow: softCardShadow }}>
      <Typography fontWeight={800} sx={{ mb: 1 }}>{title}</Typography>
      <Typography color="text.secondary">{text}</Typography>
    </Box>
  );
}

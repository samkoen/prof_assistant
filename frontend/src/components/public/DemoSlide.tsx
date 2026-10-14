import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { he } from "../../i18n/he";
import { brand } from "../../theme/brand";
import { publicOffers, type PublicOfferId } from "../../utils/publicSite";

export default function DemoSlide({ id }: { id: PublicOfferId }) {
  const offer = publicOffers().find((item) => item.id === id);
  if (!offer) return null;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, height: "100%", justifyContent: "center" }}>
      <SlideMock id={id} />
      <Typography variant="h6" fontWeight={800} sx={{ color: brand.white }}>{offer.title}</Typography>
      <Typography sx={{ color: "rgba(255,255,255,0.78)" }}>{offer.text}</Typography>
    </Box>
  );
}

function SlideMock({ id }: { id: PublicOfferId }) {
  if (id === "exams") return <ChoiceMock />;
  if (id === "explanations") return <ExplainMock />;
  if (id === "credits") return <PackMock />;
  return <QuestionMock />;
}

function QuestionMock() {
  return (
    <MockCard>
      <Typography fontWeight={700}>{he.publicHome.offers.assignments.title}</Typography>
      <Typography variant="body2">1. מהו תפקיד המשתנה בלולאה?</Typography>
      <Typography variant="body2" color="text.secondary">2. השלימו את הנוסחה.</Typography>
    </MockCard>
  );
}

function ChoiceMock() {
  return (
    <MockCard>
      <Typography fontWeight={700}>שאלה 1 מתוך 4</Typography>
      <Typography variant="body2" sx={{ mt: 1, px: 1.5, py: 0.75, borderRadius: 2, bgcolor: brand.violet100 }}>
        תשובה ב
      </Typography>
    </MockCard>
  );
}

function ExplainMock() {
  return (
    <MockCard>
      <Typography fontWeight={700}>{he.aiExplainAnswer}</Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        התשובה הנכונה היא ב, כי היא מתאימה להגדרה שנלמדה בשיעור.
      </Typography>
    </MockCard>
  );
}

function PackMock() {
  return (
    <MockCard>
      <Typography fontWeight={700}>{he.publicHome.offers.credits.title}</Typography>
      <Typography variant="body2" color="text.secondary">{he.aiCreditsUnit}</Typography>
    </MockCard>
  );
}

function MockCard({ children }: { children: ReactNode }) {
  return (
    <Box
      style={{ color: brand.slate900 }}
      sx={{ p: 2, borderRadius: 3, bgcolor: brand.violet50, border: `1px solid ${brand.violet100}` }}
    >
      {children}
    </Box>
  );
}

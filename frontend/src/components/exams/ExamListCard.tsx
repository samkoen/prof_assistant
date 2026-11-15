import type { ReactNode } from "react";
import { Box, Card, Typography } from "@mui/material";
import { brand, statusTones, type StatusTone } from "../../theme/brand";

type ExamListCardProps = {
  title: string;
  /** Pastille d'état à côté du titre. */
  chip?: ReactNode;
  /** Ce que voient les élèves dans cet état (une phrase). */
  hint?: string;
  meta: string;
  tone: StatusTone;
  actions: ReactNode;
};

const cardSx = {
  mb: 1.25,
  display: "flex",
  flexDirection: { xs: "column", sm: "row" },
  alignItems: { xs: "stretch", sm: "center" },
  gap: { xs: 1.5, sm: 2 },
  p: { xs: 1.75, sm: 2 },
  transition: "border-color 0.15s ease",
  "&:hover": { borderColor: brand.slate400 },
} as const;

/** Fiche de מטלה : titre + état, ce que voient les élèves, détails, puis actions (en dessous sur mobile). */
export default function ExamListCard({ title, chip, hint, meta, tone, actions }: ExamListCardProps) {
  return (
    <Card sx={cardSx}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
          <Typography fontWeight={600} sx={{ overflowWrap: "anywhere" }}>{title}</Typography>
          {chip}
        </Box>
        {hint && (
          <Typography variant="body2" sx={{ color: statusTones[tone].fg, fontWeight: 500 }}>
            {hint}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          {meta}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", sm: "flex-end" } }}>{actions}</Box>
    </Card>
  );
}

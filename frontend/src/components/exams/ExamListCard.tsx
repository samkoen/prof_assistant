import type { ReactNode } from "react";
import { alpha, Box, Card, CardContent, Typography } from "@mui/material";
import { brand, softCardShadow, statusTones, type StatusTone } from "../../theme/brand";

type ExamListCardProps = {
  title: string;
  /** Pastille d'état à côté du titre. */
  chip?: ReactNode;
  meta: string;
  tone: StatusTone;
  actions: ReactNode;
};

/** Fiche d'examen : bande colorée selon l'état, titre + pastille, détails, actions à gauche. */
export default function ExamListCard({ title, chip, meta, tone, actions }: ExamListCardProps) {
  return (
    <Card
      sx={{
        mb: 1.25,
        boxShadow: softCardShadow,
        borderInlineStart: `4px solid ${statusTones[tone].fg}`,
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        "&:hover": { boxShadow: `0 8px 24px ${alpha(brand.violet900, 0.1)}` },
      }}
    >
      <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", "&:last-child": { pb: 2 } }}>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
            <Typography fontWeight={800}>{title}</Typography>
            {chip}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {meta}
          </Typography>
        </Box>
        {actions}
      </CardContent>
    </Card>
  );
}

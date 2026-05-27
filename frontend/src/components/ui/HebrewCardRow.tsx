import type { ReactNode } from "react";
import { Box, Card, CardContent } from "@mui/material";
import { hebrewActionsLeftSx, hebrewCardRowSx, hebrewTextBlockSx } from "../../styles/hebrewAlign";

type HebrewCardRowProps = {
  text: ReactNode;
  actions: ReactNode;
  sx?: object;
};

/** Fiche : boutons à gauche physique, texte hébreu à droite. */
export default function HebrewCardRow({ text, actions, sx }: HebrewCardRowProps) {
  return (
    <Card sx={sx}>
      <CardContent sx={{ ...hebrewCardRowSx, "&:last-child": { pb: 2 } }}>
        <Box sx={hebrewActionsLeftSx}>{actions}</Box>
        <Box sx={hebrewTextBlockSx}>{text}</Box>
      </CardContent>
    </Card>
  );
}

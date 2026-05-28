import type { ReactNode } from "react";
import { Box, Card, CardContent } from "@mui/material";
import {
  hebrewActionsLeftSx,
  hebrewCardRowSx,
  hebrewExamListTextBlockSx,
  hebrewTextBlockSx,
} from "../../styles/hebrewAlign";

type HebrewCardRowProps = {
  text: ReactNode;
  actions: ReactNode;
  /** Liste examens : texte en ligne horizontale aligné à droite. */
  examList?: boolean;
  sx?: object;
};

/** Fiche : icônes à gauche physique, texte hébreu à droite. */
export default function HebrewCardRow({ text, actions, examList, sx }: HebrewCardRowProps) {
  const textSx = examList ? hebrewExamListTextBlockSx : hebrewTextBlockSx;

  return (
    <Card sx={{ overflow: "visible", ...sx }}>
      <CardContent
        sx={{
          ...hebrewCardRowSx,
          px: 2,
          py: 2,
          paddingInlineEnd: 1.25,
          "&:last-child": { pb: 2 },
        }}
      >
        <Box sx={textSx}>{text}</Box>
        <Box sx={hebrewActionsLeftSx}>{actions}</Box>
      </CardContent>
    </Card>
  );
}

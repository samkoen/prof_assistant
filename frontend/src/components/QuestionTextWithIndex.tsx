import type { ReactNode } from "react";
import { Box, Typography, type SxProps, type Theme } from "@mui/material";
import MathText from "./MathText";
import { examQuestionLtrSx } from "./examQuestionLtrStyles";
import { mixedLineBlockSx } from "../styles/bidiMixedText";
import {
  contentDirForQuestionText,
  firstNonEmptyLine,
  stripEditorBidiMarks,
} from "../utils/examQuestionsLanguage";

type QuestionTextWithIndexProps = {
  index: number;
  text: string;
  fontWeight?: number;
  gutterBottom?: boolean;
  sx?: SxProps<Theme>;
  children?: ReactNode;
};

function QuestionLine({ line, children }: { line: string; children?: ReactNode }) {
  return (
    <Box sx={mixedLineBlockSx(line)}>
      <MathText text={line} component="span" />
      {children}
    </Box>
  );
}

/** Ligne 1 = numéro seul (aligné comme la 1ʳᵉ ligne de texte) ; puis le texte ligne par ligne. */
export default function QuestionTextWithIndex({
  index,
  text,
  fontWeight = 600,
  gutterBottom,
  sx,
  children,
}: QuestionTextWithIndexProps) {
  const displayText = stripEditorBidiMarks(text);
  const lines = displayText.split("\n");
  const anchorLine = firstNonEmptyLine(lines);
  const ltr = contentDirForQuestionText(displayText) === "ltr";

  const numberLine = (
    <Box sx={{ ...mixedLineBlockSx(anchorLine), fontWeight }}>{index}.</Box>
  );

  const bodyLines = lines.map((line, i) => (
    <QuestionLine key={i} line={line}>
      {i === 0 ? children : undefined}
    </QuestionLine>
  ));

  if (ltr) {
    return (
      <Typography
        component="div"
        gutterBottom={gutterBottom}
        dir="ltr"
        sx={{ width: "100%", fontWeight, ...examQuestionLtrSx, ...sx }}
      >
        {numberLine}
        {bodyLines}
      </Typography>
    );
  }

  return (
    <Typography component="div" gutterBottom={gutterBottom} sx={{ width: "100%", fontWeight, ...sx }}>
      {numberLine}
      {bodyLines}
    </Typography>
  );
}

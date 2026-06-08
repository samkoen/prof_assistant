import type { ReactNode } from "react";
import { Box, Typography, type SxProps, type Theme } from "@mui/material";
import CodeMarkedText from "./CodeMarkedText";
import { examQuestionLtrSx } from "./examQuestionLtrStyles";
import { mixedLineDisplaySx } from "../utils/mixedLineDisplay";
import { parseMarkedTextSegments } from "../utils/codeBlockMarkup";
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

function anchorLineForNumber(text: string): string {
  for (const seg of parseMarkedTextSegments(text)) {
    if (seg.kind !== "text") continue;
    const line = firstNonEmptyLine(seg.content.split("\n"));
    if (line.trim()) return line;
  }
  return firstNonEmptyLine(text.split("\n"));
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
  const anchorLine = anchorLineForNumber(displayText);
  const ltr = contentDirForQuestionText(displayText) === "ltr";

  const numberLine = (
    <Box sx={{ ...mixedLineDisplaySx(anchorLine, displayText), fontWeight }}>{index}.</Box>
  );

  const bodyLines = (
    <CodeMarkedText text={displayText} questionText={displayText} firstLineExtra={children} />
  );

  if (ltr) {
    return (
      <Typography
        component="div"
        gutterBottom={gutterBottom}
        dir="ltr"
        sx={{ fontWeight, ...examQuestionLtrSx, ...sx }}
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

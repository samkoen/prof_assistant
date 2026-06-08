import type { ReactNode } from "react";
import { Box } from "@mui/material";
import MathText from "./MathText";
import { isBlankDisplayLine, mixedLineDisplaySx } from "../utils/mixedLineDisplay";

type MixedTextLineProps = {
  line: string;
  questionText?: string;
  children?: ReactNode;
};

export default function MixedTextLine({ line, questionText, children }: MixedTextLineProps) {
  const blank = isBlankDisplayLine(line);
  return (
    <Box sx={mixedLineDisplaySx(line, questionText)}>
      {!blank && <MathText text={line} component="span" />}
      {children}
    </Box>
  );
}

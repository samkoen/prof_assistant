import { Box, type SxProps, type Theme } from "@mui/material";
import {
  asciiDiagramSx,
  looksLikeAsciiDiagram,
  mathTextSx,
  renderMathMarkup,
} from "../utils/mathMarkup";

type MathTextProps = {
  text: string;
  sx?: SxProps<Theme>;
  component?: React.ElementType;
};

/** Texte avec exposants (n^2) et indices (x_i). */
export default function MathText({ text, sx, component = "span" }: MathTextProps) {
  const diagram = looksLikeAsciiDiagram(text);
  return (
    <Box
      component={component}
      dir={diagram ? "ltr" : undefined}
      sx={{ ...mathTextSx, ...(diagram ? asciiDiagramSx : {}), ...sx }}
    >
      {renderMathMarkup(text)}
    </Box>
  );
}

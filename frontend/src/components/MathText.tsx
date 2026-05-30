import { Box, type SxProps, type Theme } from "@mui/material";
import { mathTextSx, renderMathMarkup } from "../utils/mathMarkup";

type MathTextProps = {
  text: string;
  sx?: SxProps<Theme>;
  component?: React.ElementType;
};

/** Texte avec exposants (n^2) et indices (x_i). */
export default function MathText({ text, sx, component = "span" }: MathTextProps) {
  return (
    <Box component={component} sx={{ ...mathTextSx, ...sx }}>
      {renderMathMarkup(text)}
    </Box>
  );
}

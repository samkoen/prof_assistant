import { Box, Typography, type TypographyProps } from "@mui/material";
import MathText from "./MathText";
import { bidiMixedTextSx, mixedLineBlockSx } from "../styles/bidiMixedText";
import { firstNonEmptyLine, stripEditorBidiMarks } from "../utils/examQuestionsLanguage";
import QuestionImageDisplay from "./QuestionImageDisplay";

const optionTextSx = {
  display: "block",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
} as const;

type OptionDisplayProps = {
  /** Ex. « ✓ A) » — sur sa propre ligne, comme « 1. » pour la question */
  prefix: string;
  text: string;
  imageUrl?: string | null;
  color?: TypographyProps["color"];
  variant?: TypographyProps["variant"];
  dir?: "ltr" | "rtl";
  /** Direction de l’examen (question) : préfixe à droite si hébreu. */
  examDir?: "ltr" | "rtl";
};

const ltrBlockSx = {
  width: "100%",
  textAlign: "left",
  direction: "ltr",
  margin: 0,
  padding: 0,
  paddingInlineStart: 0,
} as const;

/** Réponse multi-lignes — même rendu que le texte de question (RTL ou LTR). */
export function OptionDisplay({
  prefix,
  text,
  imageUrl,
  color,
  variant = "body2",
  dir = "rtl",
  examDir = "rtl",
}: OptionDisplayProps) {
  if (dir === "ltr" && examDir === "ltr") {
    return (
      <Box
        component="div"
        dir="ltr"
        sx={{
          ...ltrBlockSx,
          mt: 0.5,
          mb: 0.75,
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 0.75,
        }}
      >
        <Typography
          variant={variant}
          component="span"
          color={color}
          sx={{ ...optionTextSx, flexShrink: 0, textAlign: "left" }}
        >
          {prefix}
        </Typography>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {text.trim() && (
            <Typography
              variant={variant}
              component="span"
              color={color}
              sx={{ ...optionTextSx, textAlign: "left" }}
            >
              <MathText text={text} component="span" />
            </Typography>
          )}
          <QuestionImageDisplay url={imageUrl} maxHeight={180} />
        </Box>
      </Box>
    );
  }
  const displayText = stripEditorBidiMarks(text);
  const lines = displayText.split("\n");
  const anchorLine = firstNonEmptyLine(lines);
  const prefixSx =
    examDir === "rtl"
      ? { ...bidiMixedTextSx, direction: "rtl" as const, textAlign: "right" as const }
      : mixedLineBlockSx(anchorLine);
  return (
    <Box component="div" color={color} sx={{ ...optionTextSx, mt: 0.5, mb: 0.75 }}>
      <Typography variant={variant} component="div" color={color} sx={prefixSx}>
        {prefix}
      </Typography>
      {lines.map((line, i) => (
        <Box key={i} sx={mixedLineBlockSx(line)}>
          {line.length > 0 && (
            <Typography variant={variant} component="span" color={color}>
              <MathText text={line} component="span" />
            </Typography>
          )}
        </Box>
      ))}
      <QuestionImageDisplay url={imageUrl} maxHeight={180} />
    </Box>
  );
}

/** Corps de réponse seul (sous radio/checkbox à l'examen). */
export function OptionText({
  text,
  imageUrl,
  color,
  variant = "body1",
}: {
  text: string;
  imageUrl?: string | null;
  color?: TypographyProps["color"];
  variant?: TypographyProps["variant"];
}) {
  const displayText = stripEditorBidiMarks(text);
  const lines = displayText.split("\n");
  return (
    <Box component="div" sx={{ ...optionTextSx, mt: 0.5, mb: 0.75 }}>
      {lines.map((line, i) => (
        <Typography key={i} variant={variant} component="div" color={color} sx={mixedLineBlockSx(line)}>
          {line.length > 0 && <MathText text={line} component="span" />}
        </Typography>
      ))}
      <QuestionImageDisplay url={imageUrl} maxHeight={180} />
    </Box>
  );
}

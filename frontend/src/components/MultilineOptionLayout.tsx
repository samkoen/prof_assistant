import { Box, Typography, type TypographyProps } from "@mui/material";
import CodeMarkedText from "./CodeMarkedText";
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
  /** Texte de la question — réponses numériques seules → RTL si question en hébreu. */
  questionText?: string;
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
  questionText,
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
            <Typography variant={variant} component="div" color={color} sx={{ ...optionTextSx, textAlign: "left" }}>
              <CodeMarkedText text={text} questionText={questionText} />
            </Typography>
          )}
          <QuestionImageDisplay url={imageUrl} maxHeight={180} />
        </Box>
      </Box>
    );
  }
  const displayText = stripEditorBidiMarks(text);
  const anchorLine = firstNonEmptyLine(displayText.split("\n"));
  const prefixSx =
    examDir === "rtl"
      ? { ...bidiMixedTextSx, direction: "rtl" as const, textAlign: "right" as const }
      : mixedLineBlockSx(anchorLine, questionText);
  return (
    <Box component="div" color={color} sx={{ ...optionTextSx, mt: 0.5, mb: 0.75 }}>
      <Typography variant={variant} component="div" color={color} sx={prefixSx}>
        {prefix}
      </Typography>
      <CodeMarkedText text={displayText} questionText={questionText} />
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
  questionText,
}: {
  text: string;
  imageUrl?: string | null;
  color?: TypographyProps["color"];
  variant?: TypographyProps["variant"];
  questionText?: string;
}) {
  const displayText = stripEditorBidiMarks(text);
  return (
    <Box component="div" sx={{ ...optionTextSx, mt: 0.5, mb: 0.75 }}>
      <Typography variant={variant} component="div" color={color} sx={{ m: 0, p: 0 }}>
        <CodeMarkedText text={displayText} questionText={questionText} />
      </Typography>
      <QuestionImageDisplay url={imageUrl} maxHeight={180} />
    </Box>
  );
}

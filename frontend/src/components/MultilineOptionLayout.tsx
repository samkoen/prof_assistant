import { Box, Typography, type TypographyProps } from "@mui/material";
import MathText from "./MathText";
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
}: OptionDisplayProps) {
  if (dir === "ltr") {
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
  return (
    <Typography
      variant={variant}
      component="div"
      color={color}
      dir={dir}
      sx={{
        ...optionTextSx,
        mt: 0.5,
        mb: 0.75,
        textAlign: "start",
        direction: dir,
      }}
    >
      {`${prefix}\n`}
      {text.trim() && <MathText text={text} component="span" />}
      <QuestionImageDisplay url={imageUrl} maxHeight={180} />
    </Typography>
  );
}

/** Corps de réponse seul (sous radio/checkbox à l'examen). */
export function OptionText({
  text,
  imageUrl,
  color,
  variant = "body1",
  dir = "rtl",
}: {
  text: string;
  imageUrl?: string | null;
  color?: TypographyProps["color"];
  variant?: TypographyProps["variant"];
  dir?: "ltr" | "rtl";
}) {
  return (
    <Typography
      variant={variant}
      component="div"
      color={color}
      dir={dir}
      sx={{
        ...optionTextSx,
        ...(dir === "ltr" ? { textAlign: "left", direction: "ltr" } : {}),
      }}
    >
      {text.trim() && <MathText text={text} component="span" />}
      <QuestionImageDisplay url={imageUrl} maxHeight={180} />
    </Typography>
  );
}

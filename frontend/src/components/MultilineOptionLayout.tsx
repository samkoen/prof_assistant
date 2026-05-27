import { Box, Typography, type TypographyProps } from "@mui/material";

const optionTextSx = {
  display: "block",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
} as const;

type OptionDisplayProps = {
  /** Ex. « ✓ A) » — sur sa propre ligne, comme « 1. » pour la question */
  prefix: string;
  text: string;
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
        <Typography
          variant={variant}
          component="span"
          color={color}
          sx={{ ...optionTextSx, flex: 1, textAlign: "left", minWidth: 0 }}
        >
          {text}
        </Typography>
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
      {`${prefix}\n${text}`}
    </Typography>
  );
}

/** Corps de réponse seul (sous radio/checkbox à l'examen). */
export function OptionText({
  text,
  color,
  variant = "body1",
}: {
  text: string;
  color?: TypographyProps["color"];
  variant?: TypographyProps["variant"];
}) {
  return (
    <Typography variant={variant} component="div" color={color} sx={optionTextSx}>
      {text}
    </Typography>
  );
}

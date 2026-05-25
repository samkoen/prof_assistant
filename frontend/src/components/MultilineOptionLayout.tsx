import { Typography, type TypographyProps } from "@mui/material";

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
};

/** Réponse multi-lignes — même rendu RTL que le texte de question. */
export function OptionDisplay({ prefix, text, color, variant = "body2" }: OptionDisplayProps) {
  return (
    <Typography
      variant={variant}
      component="div"
      color={color}
      sx={{ ...optionTextSx, mt: 0.5, mb: 0.75 }}
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

import { contentDirForLine } from "../utils/examQuestionsLanguage";

/** Texte multiligne hébreu + code/Latin : direction par ligne (Unicode bidi plaintext). */
export const bidiMixedTextSx = {
  unicodeBidi: "plaintext",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
} as const;

/** Édition mixte : chaque ligne — début à droite (RTL) ou à gauche (LTR). */
export const bidiMixedEditSx = {
  ...bidiMixedTextSx,
  textAlign: "start",
} as const;

/** Affichage mixte : alignement au « start » de chaque ligne selon sa direction. */
export function bidiMixedDisplaySx(contentDir: "ltr" | "rtl" = "rtl") {
  return {
    ...bidiMixedTextSx,
    direction: contentDir,
    textAlign: "start",
  };
}

/** Affichage lecture : une ligne = alignement explicite droite (RTL) ou gauche (LTR). */
export function mixedLineBlockSx(line: string) {
  const dir = contentDirForLine(line);
  return {
    display: "block",
    width: "100%",
    ...bidiMixedTextSx,
    direction: dir,
    textAlign: dir === "rtl" ? ("right" as const) : ("left" as const),
  };
}

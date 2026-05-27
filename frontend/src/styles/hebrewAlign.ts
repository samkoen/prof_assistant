/**
 * Alignement au bord droit physique (hébreu) malgré stylis-plugin-rtl.
 * En source : textAlign "left" → après inversion stylis → droite physique.
 */
export const hebrewAlignRightSx = {
  dir: "rtl",
  width: "100%",
  textAlign: "left",
  unicodeBidi: "isolate",
  "& .MuiTypography-root": {
    textAlign: "left",
    direction: "rtl",
  },
} as const;

/** Bloc texte hébreu (côté droit d’une fiche en flex LTR). */
export const hebrewTextBlockSx = {
  ...hebrewAlignRightSx,
  order: 2,
  flex: 1,
  minWidth: 200,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
} as const;

/**
 * Ligne fiche en flex LTR : 1er enfant = gauche physique (boutons),
 * 2e = droite physique (texte hébreu).
 */
export const hebrewCardRowSx = {
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 2,
  width: "100%",
  dir: "ltr",
  py: 2,
} as const;

/** Boutons / icônes — toujours à gauche physique (1er dans hebrewCardRowSx). */
export const hebrewActionsLeftSx = {
  order: 1,
  flexShrink: 0,
  display: "flex",
  gap: 1,
  flexWrap: "wrap",
  alignItems: "center",
} as const;

/** Barre de boutons seule (fiches יצירת…, prévisualisation, etc.). */
export const hebrewActionsBarSx = {
  display: "flex",
  flexWrap: "wrap",
  gap: 1,
  dir: "ltr",
  justifyContent: "flex-start",
  width: "100%",
} as const;

/** Flex : chips sous bannière, bord droit physique. */
export const hebrewActionsRightSx = {
  display: "flex",
  flexWrap: "wrap",
  gap: 1,
  justifyContent: "flex-end",
} as const;

/**
 * Ligne liste examen (dans HebrewCardRow) : droite → gauche physique
 * titre · statut · texte · [icônes à gauche].
 */
export const examListRowTextSx = {
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 1.5,
  width: "100%",
  dir: "ltr",
  minWidth: 0,
} as const;

export const examListRowDetailsSx = {
  dir: "rtl",
  textAlign: "left",
  unicodeBidi: "isolate",
  flex: "1 1 200px",
  minWidth: 140,
  maxWidth: "100%",
} as const;

/** En-tête liste : bouton à gauche, titre à droite. */
export const hebrewPageToolbarSx = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 2,
  mb: 3,
  width: "100%",
  dir: "ltr",
} as const;

/**
 * Utilitaires d'alignement hébreu (RTL).
 *
 * Règles :
 * - Thème MUI `direction: "rtl"` : flux logique RTL (texte, composants MUI).
 * - Écrire les valeurs CSS directement (textAlign: "right", flex-end = droite, etc.).
 * - « Îlots LTR » (`dir: "ltr"`) : uniquement pour positionner des blocs à gauche/droite
 *   PHYSIQUE (ex. actions à gauche + texte à droite dans une fiche).
 */

/** Conteneur de page : pleine largeur. */
export const pageFullWidthSx = {
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
} as const;

/** Bloc texte hébreu aligné à droite. */
export const hebrewAlignRightSx = {
  dir: "rtl",
  width: "100%",
  textAlign: "right",
} as const;

/** Bloc texte hébreu (côté droit d'une fiche). */
export const hebrewTextBlockSx = {
  ...hebrewAlignRightSx,
  flex: "1 1 0",
  minWidth: 200,
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
} as const;

/** Bloc texte liste examens — occupe la droite (sans width:100% qui masque les icônes). */
export const hebrewExamListTextBlockSx = {
  flex: "1 1 auto",
  minWidth: 0,
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 1.5,
  direction: "ltr",
  dir: "ltr",
  overflow: "visible",
} as const;

/**
 * Ligne fiche : îlot LTR + row-reverse → texte à droite, actions à gauche.
 * DOM dans HebrewCardRow : texte puis actions.
 */
export const hebrewCardRowSx = {
  display: "flex",
  flexDirection: "row-reverse",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 2,
  width: "100%",
  direction: "ltr",
  dir: "ltr",
  overflow: "visible",
  py: 2,
} as const;

/** Icônes / boutons — bord gauche physique (2e enfant DOM, 1er visuellement). */
export const hebrewActionsLeftSx = {
  flexShrink: 0,
  display: "flex",
  flexDirection: "row",
  gap: 0.5,
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "flex-start",
  direction: "ltr",
  dir: "ltr",
} as const;

/** Barre de boutons à gauche physique. */
export const hebrewActionsBarSx = {
  display: "flex",
  flexWrap: "wrap",
  gap: 1,
  dir: "ltr",
  justifyContent: "flex-start",
  width: "100%",
} as const;

/** Ligne radio/checkbox dans îlot LTR : bouton à droite, libellé hébreu à sa gauche. */
export const hebrewFormControlLabelSx = {
  margin: 0,
  marginInline: "0 !important",
  flexDirection: "row-reverse",
  alignItems: "center",
  width: "fit-content",
  maxWidth: "100%",
  "& .MuiFormControlLabel-label": {
    direction: "rtl",
    textAlign: "right",
  },
} as const;

/** Groupe radio : options empilées, ancrées au bord droit physique. */
export const hebrewRadioGroupSx = {
  width: "100%",
  dir: "ltr",
  alignItems: "flex-end",
  "& .MuiFormControlLabel-root": hebrewFormControlLabelSx,
} as const;

/** Colonne formulaire : champs et actions alignés au bord droit. */
export const hebrewFormColumnSx = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  width: "100%",
  alignItems: "flex-end",
  direction: "ltr",
  dir: "ltr",
} as const;

/** Ligne champ (select, text) — ancrée à droite. */
export const hebrewFormFieldRowSx = {
  width: "100%",
  display: "flex",
  justifyContent: "flex-end",
  direction: "ltr",
  dir: "ltr",
} as const;

export const hebrewFormFieldSx = {
  width: 320,
  maxWidth: "100%",
} as const;

/** Section formulaire (radios, scope) — bloc à droite. */
export const hebrewFormSectionSx = {
  width: "100%",
  maxWidth: 480,
  display: "flex",
  flexDirection: "column",
  gap: 1.5,
  alignItems: "flex-end",
  direction: "ltr",
  dir: "ltr",
} as const;

/** Boutons formulaire (ביטול, שליחה) au bord droit physique. */
export const hebrewFormActionsRightSx = {
  display: "flex",
  flexWrap: "wrap",
  gap: 1,
  direction: "ltr",
  dir: "ltr",
  justifyContent: "flex-end",
} as const;

/** Flex : chips / actions au bord droit physique. */
export const hebrewActionsRightSx = {
  display: "flex",
  flexWrap: "wrap",
  gap: 1,
  dir: "ltr",
  justifyContent: "flex-end",
} as const;

/** @deprecated Utiliser le wrapper `hebrewExamListTextBlockSx` dans HebrewCardRow (examList). */
export const examListRowTextSx = hebrewExamListTextBlockSx;

export const examListRowDetailsSx = {
  dir: "rtl",
  textAlign: "right",
  minWidth: 0,
  maxWidth: "100%",
} as const;

export const examListRowTitleSx = {
  flexShrink: 0,
  textAlign: "right",
  direction: "rtl",
} as const;

/** Titre / sous-titre d’en-tête — bloc à droite (dans hebrewPageToolbarSx). */
export const hebrewToolbarTitleSx = {
  ...hebrewAlignRightSx,
  flex: "1 1 auto",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  "& .MuiTypography-root": {
    width: "100%",
    textAlign: "right",
  },
} as const;

/** Boutons d’en-tête (+ תלמיד חדש, + יצירת…) — à gauche physique. */
export const hebrewToolbarActionsSx = {
  display: "flex",
  flexWrap: "wrap",
  gap: 1.5,
  flexShrink: 0,
  alignItems: "center",
} as const;

/**
 * En-tête page : îlot LTR + row-reverse → titre à droite, actions à gauche.
 * DOM : titre puis actions.
 */
export const hebrewPageToolbarSx = {
  display: "flex",
  flexDirection: "row-reverse",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 2,
  mb: 3,
  width: "100%",
  direction: "ltr",
  dir: "ltr",
} as const;

/** Menu latéral : icône à gauche physique, libellé hébreu à droite. */
export const sidebarNavButtonSx = {
  flexDirection: "row",
  direction: "ltr",
  justifyContent: "flex-start",
  gap: 1,
} as const;

export const sidebarNavIconSx = {
  minWidth: 40,
  margin: 0,
  justifyContent: "center",
} as const;

export const sidebarNavTextSx = {
  flex: 1,
  margin: 0,
  textAlign: "right",
} as const;

/** Accordéon hébreu : titre + contenu à droite, chevron à gauche (îlot LTR). */
export const hebrewAccordionSx = {
  ...hebrewAlignRightSx,
  "& .MuiAccordionSummary-root": {
    flexDirection: "row-reverse",
    direction: "ltr",
  },
  "& .MuiAccordionSummary-content": {
    justifyContent: "flex-end",
    margin: "0 !important",
    flexGrow: 1,
  },
  "& .MuiAccordionDetails-root": {
    direction: "ltr",
    display: "flex",
    justifyContent: "flex-end",
    textAlign: "right",
  },
} as const;

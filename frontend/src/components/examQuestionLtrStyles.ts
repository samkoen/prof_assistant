/** Panneau LTR (שאלות קיימות en français) — isole du thème RTL global / accordéon. */
export const examQuestionLtrSx = {
  width: "100%",
  textAlign: "left",
  direction: "ltr",
  unicodeBidi: "isolate",
  margin: 0,
  padding: 0,
  marginInlineStart: 0,
  paddingInlineStart: 0,
  "& .MuiTypography-root": {
    textAlign: "left",
    direction: "ltr",
    unicodeBidi: "plaintext",
  },
} as const;

/** Contenu AccordionDetails — évite l’héritage dir=rtl ajouté par l’accordéon. */
export const examQuestionLtrPanelSx = {
  ...examQuestionLtrSx,
  display: "block",
  boxSizing: "border-box",
} as const;

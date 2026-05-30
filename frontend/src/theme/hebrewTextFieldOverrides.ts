import type { Components, Theme } from "@mui/material/styles";

/**
 * TextField outlined en RTL sans casser le NotchedOutline MUI.
 * - Ne pas mettre dir="rtl" sur le root (fieldset + legend) : casse bordure/encoche.
 * - Encoche à droite : textAlign sur le fieldset uniquement (pas de float sur legend).
 * - Libellé : ancrage à droite via transform (miroir des valeurs LTR de MUI).
 */
export const hebrewTextFieldOverrides: Components<Theme> = {
  MuiInputLabel: {
    styleOverrides: {
      root: {
        transformOrigin: "top right !important",
        textAlign: "right",
        "&.MuiInputLabel-formControl": {
          left: "auto !important",
          right: "0 !important",
        },
      },
      outlined: {
        "&:not(.MuiInputLabel-shrink)": {
          transform: "translate(-14px, 16px) scale(1) !important",
          maxWidth: "calc(100% - 24px)",
        },
        "&.MuiInputLabel-sizeSmall:not(.MuiInputLabel-shrink)": {
          transform: "translate(-14px, 9px) scale(1) !important",
        },
      },
      shrink: {
        transform: "translate(-14px, -9px) scale(0.75) !important",
        transformOrigin: "top right !important",
        maxWidth: "calc(133% - 32px)",
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 10,
      },
      notchedOutline: {
        textAlign: "right",
      },
      input: {
        textAlign: "right",
        direction: "rtl",
      },
      inputMultiline: {
        textAlign: "right",
        direction: "rtl",
      },
    },
  },
  MuiTextField: {
    defaultProps: {
      slotProps: {
        htmlInput: { dir: "rtl" },
      },
    },
    styleOverrides: {
      root: ({ theme }) => ({
        "& .MuiOutlinedInput-root": {
          bgcolor: theme.palette.background.paper,
        },
        '&[dir="ltr"]': {
          "& .MuiInputLabel-root": {
            transformOrigin: "top left !important",
            textAlign: "left",
            left: "0 !important",
            right: "auto !important",
          },
          "& .MuiInputLabel-outlined:not(.MuiInputLabel-shrink)": {
            transform: "translate(14px, 16px) scale(1) !important",
          },
          "& .MuiInputLabel-outlined.MuiInputLabel-sizeSmall:not(.MuiInputLabel-shrink)": {
            transform: "translate(14px, 9px) scale(1) !important",
          },
          "& .MuiInputLabel-shrink": {
            transform: "translate(14px, -9px) scale(0.75) !important",
            transformOrigin: "top left !important",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            textAlign: "left",
          },
          "& .MuiOutlinedInput-input, & .MuiOutlinedInput-inputMultiline": {
            textAlign: "left",
            direction: "ltr",
          },
        },
      }),
    },
  },
};

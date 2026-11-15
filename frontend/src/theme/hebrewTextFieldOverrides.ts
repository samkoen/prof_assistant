import { alpha, type Components, type Theme } from "@mui/material/styles";

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
          transform: "translate(-14px, 14px) scale(1) !important",
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
      root: ({ theme }) => ({
        borderRadius: 8,
        backgroundColor: theme.palette.background.paper,
        transition: "box-shadow 0.15s ease",
        "&.Mui-focused": {
          boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.14)}`,
        },
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "#d0d5dd",
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "#98a2b3",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: theme.palette.primary.main,
          borderWidth: 1.5,
        },
      }),
      notchedOutline: {
        textAlign: "right",
      },
      input: {
        textAlign: "right",
        direction: "rtl",
        paddingBlock: 12,
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
          backgroundColor: theme.palette.background.paper,
        },
        '&[dir="ltr"]': {
          "& .MuiInputLabel-root": {
            transformOrigin: "top left !important",
            textAlign: "left",
            left: "0 !important",
            right: "auto !important",
          },
          "& .MuiInputLabel-outlined:not(.MuiInputLabel-shrink)": {
            transform: "translate(14px, 14px) scale(1) !important",
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

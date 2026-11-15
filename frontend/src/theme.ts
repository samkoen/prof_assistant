import { createTheme } from "@mui/material/styles";
import { brand, softCardShadow, surface } from "./theme/brand";
import { hebrewTextFieldOverrides } from "./theme/hebrewTextFieldOverrides";

/** Cible tactile minimale sur mobile (WCAG 2.5.5 / recommandations iOS-Android). */
const TOUCH_TARGET = 44;

const baseTheme = createTheme({
  direction: "rtl",
  breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } },
  typography: {
    fontFamily: '"Heebo", "Rubik", "Arial", sans-serif',
    h3: { fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 },
    h4: { fontWeight: 700, letterSpacing: "-0.015em", lineHeight: 1.25, fontSize: "1.75rem" },
    h5: { fontWeight: 700, letterSpacing: "-0.01em", fontSize: "1.35rem" },
    h6: { fontWeight: 700, fontSize: "1.08rem" },
    subtitle1: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: 0 },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.55 },
  },
  palette: {
    mode: "light",
    primary: {
      main: brand.primary600,
      dark: brand.primary700,
      light: brand.primary500,
      contrastText: brand.white,
    },
    secondary: {
      main: brand.slate700,
      dark: brand.slate900,
      light: brand.slate600,
      contrastText: brand.white,
    },
    background: { default: surface.page, paper: surface.card },
    text: { primary: brand.slate900, secondary: brand.slate600 },
    divider: surface.border,
    success: { main: "#0b7a4f" },
    warning: { main: "#b86200" },
    error: { main: "#c62828" },
    info: { main: "#0a6aa1" },
    action: { hover: surface.hover },
  },
  shape: { borderRadius: 10 },
});

export const theme = createTheme(baseTheme, {
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: { WebkitTextSizeAdjust: "100%" },
        body: { direction: "rtl", background: surface.page },
        "*::-webkit-scrollbar": { width: 8, height: 8 },
        "*::-webkit-scrollbar-thumb": { backgroundColor: surface.borderStrong, borderRadius: 8 },
        "*::-webkit-scrollbar-track": { backgroundColor: "transparent" },
      },
    },
    MuiButtonBase: {
      defaultProps: { disableRipple: false },
      styleOverrides: {
        root: {
          "&.Mui-focusVisible": {
            outline: `2px solid ${brand.primary500}`,
            outlineOffset: 2,
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingInline: 16,
          paddingBlock: 8,
          gap: 8,
          minHeight: 40,
          whiteSpace: "nowrap",
          [baseTheme.breakpoints.down("sm")]: { minHeight: TOUCH_TARGET },
        },
        startIcon: { margin: 0 },
        endIcon: { margin: 0 },
        sizeSmall: {
          minHeight: 34,
          paddingInline: 12,
          paddingBlock: 5,
          gap: 6,
          [baseTheme.breakpoints.down("sm")]: { minHeight: 40 },
        },
        sizeLarge: { minHeight: 48, paddingInline: 22, fontSize: "1rem" },
        outlined: {
          borderColor: surface.borderStrong,
          color: brand.slate900,
          backgroundColor: brand.white,
          "&:hover": { borderColor: brand.slate400, backgroundColor: surface.hover },
        },
        outlinedPrimary: {
          borderColor: surface.borderStrong,
          color: brand.primary700,
          "&:hover": { borderColor: brand.primary500, backgroundColor: brand.primary50 },
        },
        containedPrimary: {
          "&:hover": { backgroundColor: brand.primary700 },
        },
        text: { "&:hover": { backgroundColor: surface.hover } },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          "&:hover": { backgroundColor: surface.hover },
          [baseTheme.breakpoints.down("sm")]: { minWidth: 40, minHeight: 40 },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 44 },
        indicator: { height: 2, backgroundColor: brand.primary600 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          minHeight: 44,
          paddingInline: 14,
          gap: 8,
          color: brand.slate600,
          "& .MuiTab-icon": { margin: 0 },
          "&.Mui-selected": { color: brand.primary700 },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            backgroundColor: surface.subtle,
            color: brand.slate600,
            fontWeight: 600,
            fontSize: "0.82rem",
            borderBottom: `1px solid ${surface.border}`,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: { root: { borderBottom: `1px solid ${surface.border}` } },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { "&.MuiTableRow-hover:hover": { backgroundColor: surface.hover } },
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: true, enterTouchDelay: 300 },
      styleOverrides: {
        tooltip: { backgroundColor: brand.slate900, borderRadius: 6, fontSize: "0.78rem", padding: "6px 10px" },
        arrow: { color: brand.slate900 },
      },
    },
    MuiPaper: {
      styleOverrides: { rounded: { borderRadius: 12 } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { borderRadius: 12, border: `1px solid ${surface.border}`, boxShadow: softCardShadow },
      },
    },
    ...hebrewTextFieldOverrides,
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 999 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10, alignItems: "center" },
        standardInfo: { backgroundColor: "#eef5fb", color: "#0b4a6f" },
      },
    },
    MuiAccordion: {
      defaultProps: { disableGutters: true, elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: "12px !important",
          border: `1px solid ${surface.border}`,
          boxShadow: "none",
          "&:before": { display: "none" },
          overflow: "hidden",
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: { minHeight: 52, backgroundColor: brand.white, "&.Mui-expanded": { minHeight: 52 } },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
          border: "none",
          boxShadow: "0 24px 48px rgba(16, 24, 40, 0.18)",
          [baseTheme.breakpoints.down("sm")]: { margin: 12, width: "calc(100% - 24px)", maxHeight: "calc(100% - 24px)" },
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontWeight: 700, fontSize: "1.15rem" } },
    },
    MuiDialogActions: {
      styleOverrides: { root: { padding: "12px 20px 16px", gap: 8 } },
    },
    MuiListItemButton: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiAvatar: {
      styleOverrides: {
        root: { backgroundColor: brand.primary100, color: brand.primary800, fontWeight: 700 },
      },
    },
    MuiFab: {
      styleOverrides: { root: { boxShadow: "0 6px 16px rgba(16, 24, 40, 0.18)" } },
    },
    MuiMenu: {
      styleOverrides: {
        paper: { borderRadius: 10, border: `1px solid ${surface.border}`, boxShadow: "0 12px 28px rgba(16, 24, 40, 0.12)" },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          gap: 10,
          minHeight: 40,
          fontSize: "0.92rem",
          [baseTheme.breakpoints.down("sm")]: { minHeight: TOUCH_TARGET },
        },
      },
    },
    /** Pas de stylis-plugin-rtl : la flèche du Select (positionnée en `right`) est replacée à gauche. */
    MuiSelect: {
      styleOverrides: {
        icon: { right: "auto", left: 7 },
        iconOutlined: { right: "auto", left: 7 },
        select: { "&&": { paddingRight: 14, paddingLeft: 32 } },
      },
    },
    MuiFormHelperText: {
      styleOverrides: { root: { textAlign: "right", marginInline: 4 } },
    },
    MuiSkeleton: {
      styleOverrides: { root: { backgroundColor: surface.hover } },
    },
  },
});

export const ltrTheme = createTheme(theme, { direction: "ltr" });

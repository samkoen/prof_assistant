import { alpha, createTheme } from "@mui/material/styles";
import { brand, pageMeshBackground, softCardShadow } from "./theme/brand";
import { hebrewTextFieldOverrides } from "./theme/hebrewTextFieldOverrides";

export const theme = createTheme({
  direction: "rtl",
  typography: {
    fontFamily: '"Heebo", "Rubik", "Arial", sans-serif',
    h3: { fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.2 },
    h4: { fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.25 },
    h5: { fontWeight: 700, letterSpacing: "-0.015em" },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: 0 },
    body1: { lineHeight: 1.65 },
    body2: { lineHeight: 1.6 },
  },
  palette: {
    mode: "light",
    primary: {
      main: brand.violet600,
      dark: brand.violet700,
      light: brand.violet500,
      contrastText: brand.white,
    },
    secondary: {
      main: brand.amber500,
      dark: "#c4843a",
      light: brand.amber400,
      contrastText: brand.slate900,
    },
    background: {
      default: brand.violet50,
      paper: brand.white,
    },
    text: { primary: brand.slate900, secondary: brand.slate600 },
    divider: alpha(brand.violet700, 0.12),
    success: { main: "#059669" },
    warning: { main: "#d97706" },
    error: { main: "#dc2626" },
    info: { main: "#0284c7" },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          direction: "rtl",
          background: pageMeshBackground,
          backgroundAttachment: "fixed",
        },
        "*::-webkit-scrollbar": { width: 8, height: 8 },
        "*::-webkit-scrollbar-thumb": {
          backgroundColor: alpha(brand.violet600, 0.28),
          borderRadius: 8,
        },
        "*::-webkit-scrollbar-track": { backgroundColor: "transparent" },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          "&.Mui-focusVisible": {
            outline: `3px solid ${alpha(brand.violet600, 0.45)}`,
            outlineOffset: 2,
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 22,
          paddingBlock: 9,
          gap: 10,
          transition: "background-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
          "&:active": { transform: "translateY(1px)" },
        },
        startIcon: {
          margin: 0,
          marginInlineEnd: 0,
          marginInlineStart: 0,
        },
        endIcon: {
          margin: 0,
          marginInlineEnd: 0,
          marginInlineStart: 0,
        },
        sizeSmall: { gap: 8, borderRadius: 10 },
        sizeLarge: {
          borderRadius: 14,
          paddingBlock: 12,
          fontSize: "1rem",
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${brand.violet700} 0%, ${brand.violet600} 100%)`,
          boxShadow: `0 6px 18px ${alpha(brand.violet600, 0.32)}`,
          "&:hover": {
            background: `linear-gradient(135deg, ${brand.violet800} 0%, ${brand.violet700} 100%)`,
            boxShadow: `0 10px 26px ${alpha(brand.violet600, 0.4)}`,
          },
          "&.Mui-disabled": { background: alpha(brand.slate400, 0.35), boxShadow: "none" },
        },
        outlined: {
          borderColor: alpha(brand.violet600, 0.3),
          bgcolor: brand.white,
          "&:hover": {
            borderColor: brand.violet600,
            bgcolor: alpha(brand.violet100, 0.6),
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { height: 3, borderRadius: "3px 3px 0 0", backgroundColor: brand.violet600 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { fontWeight: 700, minHeight: 46, "&.Mui-selected": { color: brand.violet700 } },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            backgroundColor: brand.violet50,
            color: brand.slate700,
            fontWeight: 700,
            borderBottom: `1px solid ${alpha(brand.violet700, 0.14)}`,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { "&.MuiTableRow-hover:hover": { backgroundColor: alpha(brand.violet100, 0.45) } },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: brand.slate900,
          borderRadius: 8,
          fontSize: "0.78rem",
          padding: "6px 10px",
        },
        arrow: { color: brand.slate900 },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: `1px solid ${alpha(brand.violet600, 0.1)}`,
          boxShadow: softCardShadow,
        },
      },
    },
    ...hebrewTextFieldOverrides,
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 10 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 14 },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: "16px !important",
          border: `1px solid ${alpha(brand.violet600, 0.12)}`,
          boxShadow: softCardShadow,
          "&:before": { display: "none" },
          overflow: "hidden",
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          minHeight: 56,
          bgcolor: alpha(brand.violet100, 0.4),
          "&.Mui-expanded": { minHeight: 56 },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          border: `1px solid ${alpha(brand.violet500, 0.16)}`,
          boxShadow: `0 24px 64px ${alpha(brand.violet900, 0.16)}`,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          background: `linear-gradient(135deg, ${brand.violet600} 0%, ${brand.sky500} 100%)`,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: `0 8px 24px ${alpha(brand.violet600, 0.28)}`,
        },
      },
    },
  },
});

export const ltrTheme = createTheme(theme, { direction: "ltr" });

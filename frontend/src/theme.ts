import { alpha, createTheme } from "@mui/material/styles";
import { brand, pageMeshBackground } from "./theme/brand";
import { hebrewTextFieldOverrides } from "./theme/hebrewTextFieldOverrides";

export const theme = createTheme({
  direction: "rtl",
  typography: {
    fontFamily: '"Heebo", "Arial", sans-serif',
    h4: { fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.25 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
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
    divider: alpha(brand.violet700, 0.1),
    success: { main: "#059669" },
    warning: { main: "#d97706" },
    error: { main: "#dc2626" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          direction: "rtl",
          background: pageMeshBackground,
          backgroundAttachment: "fixed",
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingInline: 20,
          gap: 10,
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
        sizeSmall: {
          gap: 8,
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${brand.violet700} 0%, ${brand.violet500} 100%)`,
          boxShadow: `0 4px 14px ${alpha(brand.violet600, 0.28)}`,
          "&:hover": {
            background: `linear-gradient(135deg, ${brand.violet800} 0%, ${brand.violet600} 100%)`,
          },
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: `1px solid ${alpha(brand.violet600, 0.1)}`,
          boxShadow: `0 4px 20px ${alpha(brand.violet700, 0.08)}`,
        },
      },
    },
    ...hebrewTextFieldOverrides,
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 10 } },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: "12px !important",
          border: `1px solid ${alpha(brand.violet600, 0.12)}`,
          boxShadow: `0 4px 20px ${alpha(brand.violet600, 0.08)}`,
          "&:before": { display: "none" },
          overflow: "hidden",
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          minHeight: 56,
          bgcolor: alpha(brand.violet100, 0.45),
          "&.Mui-expanded": { minHeight: 56 },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: `1px solid ${alpha(brand.violet500, 0.2)}`,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          background: `linear-gradient(135deg, ${brand.violet600} 0%, ${brand.violet500} 100%)`,
        },
      },
    },
  },
});

export const ltrTheme = createTheme(theme, { direction: "ltr" });

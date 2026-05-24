import { alpha, createTheme } from "@mui/material/styles";

export const theme = createTheme({
  direction: "rtl",
  typography: {
    fontFamily: '"Heebo", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  palette: {
    primary: { main: "#1565c0", dark: "#0d47a1", light: "#42a5f5", contrastText: "#fff" },
    secondary: { main: "#00838f" },
    background: { default: "#f0f4f8", paper: "#ffffff" },
    text: { primary: "#1a2332", secondary: "#5c6b7a" },
    divider: alpha("#1a2332", 0.08),
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { direction: "rtl" },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        root: {
          flexShrink: 0,
        },
        paper: {
          boxSizing: "border-box",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

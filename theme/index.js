import { createTheme } from "@mui/material/styles";

/** MUI multiplies sx borderRadius by this base (e.g. 2 → 8px, 3 → 12px). */
const radiusBase = 4;

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2563eb",
      dark: "#1d4ed8",
      light: "#60a5fa",
    },
    secondary: {
      main: "#0f172a",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a",
      secondary: "#64748b",
    },
    warning: {
      main: "#f59e0b",
    },
  },
  shape: {
    borderRadius: radiusBase,
  },
  typography: {
    fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
    h3: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    subtitle1: {
      fontWeight: 700,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 4px 24px rgba(15, 23, 42, 0.06)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
  },
});

export default theme;

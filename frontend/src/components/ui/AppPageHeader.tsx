import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { brand } from "../../theme/brand";

export type AppPageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Lien de retour discret au-dessus du titre (ex. « חזרה לקורסים »). */
  back?: { to: string; label: string };
  /** Actions de page : l'action principale en dernier (bouton plein). */
  actions?: ReactNode;
  /** Pastilles / méta affichées sous le titre (statut, compteurs…). */
  meta?: ReactNode;
  size?: "large" | "medium";
};

function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Button
      component={RouterLink}
      to={to}
      size="small"
      startIcon={<ArrowForwardIcon fontSize="small" />}
      sx={{ alignSelf: "flex-start", px: 0.5, minHeight: 32, mb: 0.5, color: brand.slate600, fontWeight: 500 }}
    >
      {label}
    </Button>
  );
}

const rowSx = {
  display: "flex",
  flexDirection: { xs: "column", sm: "row" },
  alignItems: { xs: "stretch", sm: "flex-start" },
  justifyContent: "space-between",
  gap: { xs: 1.5, sm: 2 },
} as const;

const actionsSx = {
  display: "flex",
  flexWrap: "wrap",
  gap: 1,
  flexShrink: 0,
  alignItems: "center",
  "& > .MuiButton-root": { flex: { xs: "1 1 auto", sm: "0 0 auto" } },
} as const;

/**
 * En-tête unique des pages connectées : retour, titre, sous-titre, méta et actions.
 * Sur mobile les actions passent sous le titre et prennent toute la largeur.
 */
export default function AppPageHeader({ title, subtitle, back, actions, meta, size = "large" }: AppPageHeaderProps) {
  return (
    <Box component="header" dir="rtl" sx={{ mb: { xs: 2.5, sm: 3 }, textAlign: "right" }}>
      {back && <BackLink to={back.to} label={back.label} />}
      <Box sx={rowSx}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant={size === "large" ? "h4" : "h5"} component="h1" sx={{ color: brand.slate900, overflowWrap: "anywhere" }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 720 }}>
              {subtitle}
            </Typography>
          )}
          {meta && <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.25 }}>{meta}</Box>}
        </Box>
        {actions && <Box sx={actionsSx}>{actions}</Box>}
      </Box>
    </Box>
  );
}

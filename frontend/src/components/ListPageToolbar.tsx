import type { ReactNode } from "react";
import { Box, Button, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { hebrewAlignRightSx, hebrewPageToolbarSx } from "../styles/hebrewAlign";

interface ListPageToolbarProps {
  title: ReactNode;
  subtitle?: string;
  addLabel?: string;
  onAdd?: () => void;
  /** Boutons à gauche physique (remplace addLabel/onAdd si fourni). */
  actions?: ReactNode;
  titleVariant?: "h4" | "h5";
}

function renderActions(actions: ReactNode | undefined, addLabel?: string, onAdd?: () => void) {
  if (actions) {
    return (
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, flexShrink: 0 }}>
        {actions}
      </Box>
    );
  }
  if (addLabel && onAdd) {
    return (
      <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={onAdd} sx={{ flexShrink: 0 }}>
        {addLabel}
      </Button>
    );
  }
  return null;
}

export default function ListPageToolbar({
  title,
  subtitle,
  addLabel,
  onAdd,
  actions,
  titleVariant = "h4",
}: ListPageToolbarProps) {
  const actionSlot = renderActions(actions, addLabel, onAdd);

  return (
    <Box sx={hebrewPageToolbarSx}>
      {actionSlot}
      <Box sx={{ ...hebrewAlignRightSx, flex: 1, minWidth: 0 }}>
        <Typography variant={titleVariant} component="h1" fontWeight={700}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

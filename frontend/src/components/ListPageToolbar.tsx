import type { ReactNode } from "react";
import { Box, Button, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  hebrewPageToolbarSx,
  hebrewToolbarActionsSx,
  hebrewToolbarTitleSx,
} from "../styles/hebrewAlign";

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
    return <Box sx={hebrewToolbarActionsSx}>{actions}</Box>;
  }
  if (addLabel && onAdd) {
    return (
      <Box sx={hebrewToolbarActionsSx}>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={onAdd}>
          {addLabel}
        </Button>
      </Box>
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
      <Box sx={hebrewToolbarTitleSx}>
        <Typography variant={titleVariant} component="h1" fontWeight={700}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actionSlot}
    </Box>
  );
}

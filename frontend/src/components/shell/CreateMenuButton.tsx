import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, IconButton, ListItemIcon, Menu, MenuItem, Typography, useMediaQuery, type Theme } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import type { CreateAction } from "../../config/createActions";
import { he } from "../../i18n/he";
import { brand } from "../../theme/brand";

function Trigger({ compact, onOpen }: { compact: boolean; onOpen: (el: HTMLElement) => void }) {
  if (compact) {
    return (
      <IconButton
        aria-label={he.createMenuLabel}
        onClick={(e) => onOpen(e.currentTarget)}
        sx={{ bgcolor: brand.primary600, color: brand.white, "&:hover": { bgcolor: brand.primary700 } }}
      >
        <AddIcon />
      </IconButton>
    );
  }
  return (
    <Button variant="contained" startIcon={<AddIcon />} endIcon={<KeyboardArrowDownIcon />} onClick={(e) => onOpen(e.currentTarget)} aria-haspopup="menu">
      {he.createMenu}
    </Button>
  );
}

function ActionItem({ action, onPick }: { action: CreateAction; onPick: (to: string) => void }) {
  return (
    <MenuItem onClick={() => onPick(action.to)} sx={{ py: 1, alignItems: "flex-start", minWidth: 260 }}>
      <ListItemIcon sx={{ mt: 0.25, color: brand.primary600 }}>{action.icon}</ListItemIcon>
      <Box>
        <Typography variant="body2" fontWeight={600}>{action.label}</Typography>
        <Typography variant="caption" color="text.secondary">{action.hint}</Typography>
      </Box>
    </MenuItem>
  );
}

/** Bouton « יצירה » toujours visible : point d'entrée unique pour créer une מטלה, un קורס ou un מקצוע. */
export default function CreateMenuButton({ actions }: { actions: CreateAction[] }) {
  const navigate = useNavigate();
  const compact = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const pick = (to: string) => {
    setAnchor(null);
    navigate(to);
  };
  return (
    <>
      <Trigger compact={compact} onOpen={setAnchor} />
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "left" }} transformOrigin={{ vertical: "top", horizontal: "left" }}>
        {actions.map((action) => (
          <ActionItem key={action.to} action={action} onPick={pick} />
        ))}
      </Menu>
    </>
  );
}

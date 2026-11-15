import { useState, type ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { he } from "../../i18n/he";

export type MenuAction = {
  key: string;
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  /** Lien interne (prioritaire sur onClick). */
  to?: string;
  disabled?: boolean;
  /** Action destructive : rouge, séparée des autres. */
  danger?: boolean;
};

type ActionsMenuProps = {
  actions: MenuAction[];
  label?: string;
  disabled?: boolean;
};

function ActionItem({ action, onDone }: { action: MenuAction; onDone: () => void }) {
  const routerProps = action.to ? { component: RouterLink, to: action.to } : {};
  return (
    <MenuItem
      {...routerProps}
      disabled={action.disabled}
      onClick={() => {
        onDone();
        action.onClick?.();
      }}
      sx={action.danger ? { color: "error.main", "& .MuiListItemIcon-root": { color: "error.main" } } : undefined}
    >
      <ListItemIcon>{action.icon}</ListItemIcon>
      <ListItemText primaryTypographyProps={{ fontSize: "0.92rem" }}>{action.label}</ListItemText>
    </MenuItem>
  );
}

/** Menu « ⋮ » : regroupe les actions secondaires ; les actions destructives sont isolées en bas. */
export default function ActionsMenu({ actions, label = he.moreExamActions, disabled }: ActionsMenuProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  if (actions.length === 0) return null;
  const regular = actions.filter((a) => !a.danger);
  const danger = actions.filter((a) => a.danger);
  const close = () => setAnchor(null);
  return (
    <>
      <Tooltip title={label}>
        <span>
          <IconButton aria-label={label} aria-haspopup="menu" disabled={disabled} onClick={(e) => setAnchor(e.currentTarget)} sx={{ color: "text.secondary" }}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close} dir="rtl" anchorOrigin={{ vertical: "bottom", horizontal: "left" }} transformOrigin={{ vertical: "top", horizontal: "left" }}>
        {regular.map((action) => (
          <ActionItem key={action.key} action={action} onDone={close} />
        ))}
        {regular.length > 0 && danger.length > 0 && <Divider />}
        {danger.map((action) => (
          <ActionItem key={action.key} action={action} onDone={close} />
        ))}
      </Menu>
    </>
  );
}

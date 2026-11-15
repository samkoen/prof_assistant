import { Avatar, Box, ButtonBase, IconButton, Tooltip, Typography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import type { User } from "../../api/client";
import { PROFILE_PATH, roleLabel } from "../../config/menuItems";
import { he } from "../../i18n/he";
import { brand, surface } from "../../theme/brand";

type SidebarUserFooterProps = {
  user: User;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

export function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] || "?").toUpperCase();
}

const footerSx = {
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  gap: 0.5,
  p: 1.25,
  borderTop: `1px solid ${surface.border}`,
} as const;

const profileButtonSx = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 1.25,
  p: 0.75,
  borderRadius: 2,
  textAlign: "right",
  "&:hover": { bgcolor: surface.hover },
} as const;

function UserSummary({ user }: { user: User }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" fontWeight={600} noWrap sx={{ color: brand.slate900 }}>
        {user.full_name}
      </Typography>
      <Typography variant="caption" noWrap sx={{ color: brand.slate600, display: "block" }}>
        {roleLabel(user.role)} · {he.myProfile}
      </Typography>
    </Box>
  );
}

/** Pied de la barre latérale : accès au profil et déconnexion. */
export default function SidebarUserFooter({ user, onNavigate, onLogout }: SidebarUserFooterProps) {
  return (
    <Box sx={footerSx}>
      <ButtonBase onClick={() => onNavigate(PROFILE_PATH)} sx={profileButtonSx} aria-label={he.myProfile}>
        <Avatar sx={{ width: 36, height: 36, fontSize: "0.85rem" }}>{userInitials(user.full_name)}</Avatar>
        <UserSummary user={user} />
      </ButtonBase>
      <Tooltip title={he.logout}>
        <IconButton onClick={onLogout} aria-label={he.logout} sx={{ color: brand.slate400, "&:hover": { color: "#b42318", bgcolor: "#fdecea" } }}>
          <LogoutIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

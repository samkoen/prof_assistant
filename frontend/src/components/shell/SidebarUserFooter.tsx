import { alpha, Avatar, Box, ButtonBase, IconButton, Tooltip, Typography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import type { User } from "../../api/client";
import { PROFILE_PATH, roleLabel } from "../../config/menuItems";
import { he } from "../../i18n/he";
import { brand } from "../../theme/brand";

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
  gap: 0.75,
  p: 1.5,
  borderTop: `1px solid ${alpha(brand.white, 0.1)}`,
} as const;

const profileButtonSx = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 1.25,
  p: 1,
  borderRadius: 2.5,
  textAlign: "right",
  "&:hover": { bgcolor: alpha(brand.white, 0.09) },
} as const;

function UserSummary({ user }: { user: User }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" fontWeight={700} noWrap sx={{ color: brand.white }}>
        {user.full_name}
      </Typography>
      <Typography variant="caption" noWrap sx={{ color: alpha(brand.white, 0.65) }}>
        {roleLabel(user.role)}
      </Typography>
    </Box>
  );
}

export default function SidebarUserFooter({ user, onNavigate, onLogout }: SidebarUserFooterProps) {
  return (
    <Box sx={footerSx}>
      <ButtonBase onClick={() => onNavigate(PROFILE_PATH)} sx={profileButtonSx} aria-label={he.myProfile}>
        <Avatar sx={{ width: 38, height: 38, fontSize: "0.88rem", fontWeight: 700 }}>{userInitials(user.full_name)}</Avatar>
        <UserSummary user={user} />
      </ButtonBase>
      <Tooltip title={he.logout}>
        <IconButton onClick={onLogout} aria-label={he.logout} sx={{ color: alpha(brand.white, 0.75), "&:hover": { color: "#fecaca", bgcolor: alpha("#ef4444", 0.18) } }}>
          <LogoutIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

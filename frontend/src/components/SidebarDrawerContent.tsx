import {
  alpha,
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LogoutIcon from "@mui/icons-material/Logout";
import QuizIcon from "@mui/icons-material/Quiz";
import type { User } from "../api/client";
import { PROFILE_PATH, roleLabel, type MenuItemDef } from "../config/menuItems";
import { he } from "../i18n/he";
import {
  sidebarFooterSx,
  sidebarHeaderSx,
  sidebarNavButtonSx,
  sidebarNavIconSx,
  sidebarNavListScrollSx,
  sidebarNavTextSx,
} from "../styles/hebrewAlign";
import { brand, sidebarGradient } from "../theme/brand";

function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] || "?").toUpperCase();
}

type SidebarDrawerContentProps = {
  menuItems: MenuItemDef[];
  user: User | null;
  pathname: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  onHideSidebar?: () => void;
};

function SidebarHeader({ onHideSidebar }: { onHideSidebar?: () => void }) {
  return (
    <Box sx={sidebarHeaderSx}>
      <Box display="flex" alignItems="center" gap={1.5}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2.5,
            background: `linear-gradient(135deg, ${brand.violet500} 0%, ${brand.amber400} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <QuizIcon sx={{ fontSize: 26 }} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2} noWrap>
            {he.appName}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.75 }} noWrap>
            {he.platformSubtitle}
          </Typography>
        </Box>
        {onHideSidebar && (
          <IconButton
            size="small"
            onClick={onHideSidebar}
            aria-label={he.hideSidebar}
            sx={{
              flexShrink: 0,
              color: alpha("#fff", 0.85),
              bgcolor: alpha("#fff", 0.08),
              "&:hover": { bgcolor: alpha("#fff", 0.16) },
            }}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}

function SidebarMenu({
  menuItems,
  pathname,
  onNavigate,
}: Pick<SidebarDrawerContentProps, "menuItems" | "pathname" | "onNavigate">) {
  return (
    <List sx={sidebarNavListScrollSx}>
      {menuItems.map((item) => {
        const selected = item.matchPathPrefix
          ? pathname.startsWith(item.matchPathPrefix)
          : pathname === item.path;
        return (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.75 }}>
            <ListItemButton
              selected={selected}
              onClick={() => onNavigate(item.path)}
              sx={{
                ...sidebarNavButtonSx,
                borderRadius: 2,
                py: 1.1,
                color: alpha("#fff", 0.75),
                "&:hover": { bgcolor: alpha("#fff", 0.1), color: "#fff" },
                "&.Mui-selected": {
                  bgcolor: alpha("#fff", 0.18),
                  color: "#fff",
                  boxShadow: `inset 4px 0 0 ${brand.amber400}`,
                  "& .MuiListItemIcon-root": { color: brand.amber400 },
                },
                "& .MuiListItemIcon-root": {
                  ...sidebarNavIconSx,
                  color: selected ? brand.amber400 : alpha("#fff", 0.65),
                },
                "& .MuiListItemText-root": sidebarNavTextSx,
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: "0.9rem",
                  fontWeight: selected ? 700 : 500,
                  textAlign: "right",
                }}
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}

function SidebarUserFooter({
  user,
  onNavigate,
  onLogout,
}: {
  user: User;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}) {
  return (
    <>
      <Divider sx={{ borderColor: alpha("#fff", 0.12) }} />
      <Box sx={{ ...sidebarFooterSx, p: 1.5, mx: 1, mb: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            p: 1,
            borderRadius: 2,
            cursor: "pointer",
            "&:hover": { bgcolor: alpha("#fff", 0.08) },
          }}
          onClick={() => onNavigate(PROFILE_PATH)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onNavigate(PROFILE_PATH);
          }}
        >
          <Avatar
            sx={{
              width: 40,
              height: 40,
              fontSize: "0.9rem",
              background: `linear-gradient(135deg, ${brand.violet600}, ${brand.violet500})`,
            }}
          >
            {userInitials(user.full_name)}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" fontWeight={700} noWrap>
              {user.full_name}
            </Typography>
            <Chip
              label={roleLabel(user.role)}
              size="small"
              sx={{
                mt: 0.5,
                height: 22,
                fontSize: "0.7rem",
                fontWeight: 700,
                bgcolor: alpha(brand.amber400, 0.22),
                color: brand.amber400,
              }}
            />
          </Box>
        </Box>
        <ListItemButton
          onClick={onLogout}
          sx={{
            mt: 0.5,
            borderRadius: 2,
            color: alpha("#fff", 0.9),
            bgcolor: alpha("#dc2626", 0.22),
            "&:hover": { bgcolor: alpha("#dc2626", 0.35) },
            ...sidebarNavButtonSx,
          }}
        >
          <ListItemIcon sx={{ ...sidebarNavIconSx, color: alpha("#fff", 0.9) }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={he.logout}
            primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: 600, textAlign: "right" }}
          />
        </ListItemButton>
      </Box>
    </>
  );
}

export default function SidebarDrawerContent({
  menuItems,
  user,
  pathname,
  onNavigate,
  onLogout,
  onHideSidebar,
}: SidebarDrawerContentProps) {
  return (
    <Box
      sx={{
        height: "100%",
        maxHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: sidebarGradient,
        color: brand.white,
      }}
    >
      <SidebarHeader onHideSidebar={onHideSidebar} />
      <SidebarMenu menuItems={menuItems} pathname={pathname} onNavigate={onNavigate} />
      {user && <SidebarUserFooter user={user} onNavigate={onNavigate} onLogout={onLogout} />}
    </Box>
  );
}

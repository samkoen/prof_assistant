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
import BrandMark from "./ui/BrandMark";
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
import { brand, softCardShadow } from "../theme/brand";

function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] || "?").toUpperCase();
}

type MenuBadges = Partial<Record<NonNullable<MenuItemDef["badgeKey"]>, number>>;

type SidebarDrawerContentProps = {
  menuItems: MenuItemDef[];
  user: User | null;
  pathname: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  onHideSidebar?: () => void;
  badges?: MenuBadges;
};

function SidebarHeader({ onHideSidebar }: { onHideSidebar?: () => void }) {
  return (
    <Box
      sx={{
        ...sidebarHeaderSx,
        borderBottom: `1px solid ${alpha(brand.violet600, 0.1)}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
      }}
    >
      <BrandMark size="sm" align="start" />
      {onHideSidebar && (
        <IconButton
          size="small"
          onClick={onHideSidebar}
          aria-label={he.hideSidebar}
          sx={{
            flexShrink: 0,
            color: brand.violet700,
            bgcolor: alpha(brand.violet600, 0.08),
            "&:hover": { bgcolor: alpha(brand.violet600, 0.14) },
          }}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
}

function menuBadgeCount(item: MenuItemDef, badges?: MenuBadges): number {
  if (!item.badgeKey || !badges) return 0;
  return badges[item.badgeKey] ?? 0;
}

function SidebarMenu({
  menuItems,
  pathname,
  onNavigate,
  badges,
}: Pick<SidebarDrawerContentProps, "menuItems" | "pathname" | "onNavigate" | "badges">) {
  return (
    <List
      sx={{
        ...sidebarNavListScrollSx,
        "&::-webkit-scrollbar-thumb": {
          bgcolor: alpha(brand.violet600, 0.28),
          borderRadius: 3,
        },
      }}
    >
      {menuItems.map((item) => {
        const selected = item.matchPathPrefix
          ? pathname.startsWith(item.matchPathPrefix)
          : pathname === item.path;
        const badge = menuBadgeCount(item, badges);
        return (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={selected}
              onClick={() => onNavigate(item.path)}
              sx={{
                ...sidebarNavButtonSx,
                borderRadius: 2.5,
                py: 1.15,
                color: brand.slate600,
                "&:hover": {
                  bgcolor: alpha(brand.violet600, 0.08),
                  color: brand.violet800,
                },
                "&.Mui-selected": {
                  bgcolor: alpha(brand.violet600, 0.12),
                  color: brand.violet800,
                  boxShadow: `inset 3px 0 0 ${brand.violet600}`,
                  "&:hover": { bgcolor: alpha(brand.violet600, 0.16) },
                  "& .MuiListItemIcon-root": { color: brand.violet600 },
                },
                "& .MuiListItemIcon-root": {
                  ...sidebarNavIconSx,
                  color: selected ? brand.violet600 : brand.slate400,
                },
                "& .MuiListItemText-root": sidebarNavTextSx,
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: "0.92rem",
                  fontWeight: selected ? 700 : 500,
                  textAlign: "right",
                }}
              />
              {badge > 0 && (
                <Chip
                  size="small"
                  label={badge > 99 ? "99+" : badge}
                  sx={{
                    height: 22,
                    minWidth: 22,
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    bgcolor: brand.amber500,
                    color: brand.slate900,
                  }}
                />
              )}
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
      <Divider sx={{ borderColor: alpha(brand.violet600, 0.1) }} />
      <Box sx={{ ...sidebarFooterSx, p: 1.5, mx: 1, mb: 1.25 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            p: 1.25,
            borderRadius: 2.5,
            cursor: "pointer",
            bgcolor: alpha(brand.violet600, 0.05),
            border: `1px solid ${alpha(brand.violet600, 0.08)}`,
            "&:hover": { bgcolor: alpha(brand.violet600, 0.1) },
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
              fontWeight: 700,
            }}
          >
            {userInitials(user.full_name)}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" fontWeight={700} noWrap color="text.primary">
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
                bgcolor: alpha(brand.violet600, 0.12),
                color: brand.violet700,
              }}
            />
          </Box>
        </Box>
        <ListItemButton
          onClick={onLogout}
          sx={{
            mt: 1,
            borderRadius: 2.5,
            color: "#b91c1c",
            bgcolor: alpha("#dc2626", 0.06),
            border: `1px solid ${alpha("#dc2626", 0.12)}`,
            "&:hover": { bgcolor: alpha("#dc2626", 0.12) },
            ...sidebarNavButtonSx,
          }}
        >
          <ListItemIcon sx={{ ...sidebarNavIconSx, color: "#b91c1c" }}>
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
  badges,
}: SidebarDrawerContentProps) {
  return (
    <Box
      sx={{
        height: "100%",
        maxHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: `linear-gradient(180deg, ${brand.white} 0%, ${brand.violet50} 100%)`,
        color: brand.slate900,
        borderInlineEnd: `1px solid ${alpha(brand.violet600, 0.12)}`,
        boxShadow: softCardShadow,
      }}
    >
      <SidebarHeader onHideSidebar={onHideSidebar} />
      <SidebarMenu
        menuItems={menuItems}
        pathname={pathname}
        onNavigate={onNavigate}
        badges={badges}
      />
      {user && <SidebarUserFooter user={user} onNavigate={onNavigate} onLogout={onLogout} />}
    </Box>
  );
}

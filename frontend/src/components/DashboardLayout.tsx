import { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  alpha,
  AppBar,
  Avatar,
  Box,
  Chip,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../context/AuthContext";
import { getMenuItems, roleLabel } from "../config/menuItems";
import { he } from "../i18n/he";
import { SIDEBAR_WIDTH } from "../constants/layout";

function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] || "?").toUpperCase();
}

export default function DashboardLayout() {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = useMemo(() => (user ? getMenuItems(user.role) : []), [user]);

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          px: 2.5,
          py: 2.5,
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: "primary.contrastText",
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          {he.appName}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.9, display: "block", mt: 0.25 }}>
          {he.platformSubtitle}
        </Typography>
      </Box>
      <List sx={{ flex: 1, px: 1.5, py: 2 }}>
        {menuItems.map((item) => {
          const selected = item.matchPathPrefix
            ? location.pathname.startsWith(item.matchPathPrefix)
            : location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={selected}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  py: 1.1,
                  "&.Mui-selected": {
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: "primary.dark",
                    "& .MuiListItemIcon-root": { color: "primary.main" },
                  },
                  "& .MuiListItemIcon-root": {
                    minWidth: 40,
                    color: selected ? "primary.main" : "text.secondary",
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: "0.9rem",
                    fontWeight: selected ? 600 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      {user && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main", fontSize: "0.85rem" }}>
                {userInitials(user.full_name)}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {user.full_name}
                </Typography>
                <Chip
                  label={roleLabel(user.role)}
                  size="small"
                  sx={{
                    mt: 0.5,
                    height: 20,
                    fontSize: "0.65rem",
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: "primary.dark",
                  }}
                />
              </Box>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );

  const drawerPaperSx = {
    boxSizing: "border-box" as const,
    width: SIDEBAR_WIDTH,
    position: "relative" as const,
    height: "100vh",
    borderLeft: `1px solid ${theme.palette.divider}`,
    bgcolor: "background.paper",
  };

  /** En RTL, anchor=left place le tiroir à droite (physique). */
  const drawerAnchor: "left" | "right" = "left";

  const appBarWidth = { xs: "100%", sm: `calc(100% - ${SIDEBAR_WIDTH}px)` };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          left: 0,
          right: { xs: 0, sm: `${SIDEBAR_WIDTH}px` },
          width: appBarWidth,
          maxWidth: appBarWidth,
          bgcolor: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: "blur(12px)",
          color: "text.primary",
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            color="inherit"
            aria-label={he.mainMenu}
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ display: { sm: "none" }, mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" gap={2}>
            <Typography variant="h6" fontWeight={700} noWrap>
              {he.appName}
            </Typography>
            {user && (
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" fontWeight={600} sx={{ display: { xs: "none", md: "block" } }}>
                  {user.full_name}
                </Typography>
                <IconButton
                  onClick={() => logout().then(() => navigate("/login"))}
                  size="small"
                  aria-label={he.logout}
                  sx={{
                    bgcolor: alpha(theme.palette.error.main, 0.08),
                    color: "error.main",
                  }}
                >
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/*
        Flex + dir=rtl (html) : 1er enfant = menu à droite, 2e = contenu à gauche.
        Le tiroir n’est plus en position fixed qui recouvre le tableau.
      */}
      <Drawer
        variant="temporary"
        anchor={drawerAnchor}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": { ...drawerPaperSx, position: "fixed" },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="permanent"
        anchor={drawerAnchor}
        open
        sx={{
          display: { xs: "none", sm: "block" },
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          order: 0,
          "&.MuiDrawer-docked": {
            position: "relative",
            height: "100vh",
            width: SIDEBAR_WIDTH,
          },
          "& .MuiDrawer-paper": drawerPaperSx,
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flex: "1 1 0",
          minWidth: 0,
          width: 0,
          order: 1,
          boxSizing: "border-box",
          px: { xs: 2, sm: 3 },
          pb: { xs: 2, sm: 3 },
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />
        <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

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
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import QuizIcon from "@mui/icons-material/Quiz";
import { useAuth } from "../context/AuthContext";
import { getMenuItems, PROFILE_PATH, roleLabel } from "../config/menuItems";
import { he } from "../i18n/he";
import { SIDEBAR_WIDTH } from "../constants/layout";
import {
  hebrewAlignRightSx,
  sidebarNavButtonSx,
  sidebarNavIconSx,
  sidebarNavTextSx,
} from "../styles/hebrewAlign";
import { brand, sidebarGradient } from "../theme/brand";

function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] || "?").toUpperCase();
}

export default function DashboardLayout() {
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
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: sidebarGradient,
        color: brand.white,
      }}
    >
      <Box sx={{ px: 2.5, py: 3, borderBottom: `1px solid ${alpha("#fff", 0.12)}` }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2.5,
              background: `linear-gradient(135deg, ${brand.violet500} 0%, ${brand.amber400} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <QuizIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} lineHeight={1.2}>
              {he.appName}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.75 }}>
              {he.platformSubtitle}
            </Typography>
          </Box>
        </Box>
      </Box>

      <List sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 1.5, py: 2 }}>
        {menuItems.map((item) => {
          const selected = item.matchPathPrefix
            ? location.pathname.startsWith(item.matchPathPrefix)
            : location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.75 }}>
              <ListItemButton
                selected={selected}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  ...sidebarNavButtonSx,
                  borderRadius: 2,
                  py: 1.25,
                  color: alpha("#fff", 0.75),
                  "&:hover": {
                    bgcolor: alpha("#fff", 0.1),
                    color: "#fff",
                  },
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
                    fontSize: "0.95rem",
                    fontWeight: selected ? 700 : 500,
                    textAlign: "right",
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {user && (
        <>
          <Divider sx={{ borderColor: alpha("#fff", 0.12) }} />
          <Box
            sx={{
              p: 2,
              cursor: "pointer",
              borderRadius: 2,
              mx: 1,
              "&:hover": { bgcolor: alpha("#fff", 0.08) },
            }}
            onClick={() => handleNavigation(PROFILE_PATH)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleNavigation(PROFILE_PATH);
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
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
    border: "none",
    bgcolor: "transparent",
  };

  const drawerAnchor: "left" | "right" = "left";
  const appBarWidth = { xs: "100%", sm: `calc(100% - ${SIDEBAR_WIDTH}px)` };

  return (
    <Box sx={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden" }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          left: 0,
          right: { xs: 0, sm: `${SIDEBAR_WIDTH}px` },
          width: appBarWidth,
          maxWidth: appBarWidth,
          bgcolor: brand.white,
          color: brand.violet800,
          borderBottom: `1px solid ${alpha(brand.violet500, 0.15)}`,
          boxShadow: `0 2px 12px ${alpha(brand.violet600, 0.06)}`,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            color="inherit"
            aria-label={he.mainMenu}
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ display: { sm: "none" }, mr: 2, color: brand.violet700 }}
          >
            <MenuIcon />
          </IconButton>
          <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" gap={2}>
            <Typography variant="h6" fontWeight={700} noWrap sx={{ color: brand.violet800 }}>
              {he.appName}
            </Typography>
            {user && (
              <Box display="flex" alignItems="center" gap={1}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  onClick={() => navigate(PROFILE_PATH)}
                  sx={{
                    display: { xs: "none", md: "block" },
                    color: brand.slate600,
                    cursor: "pointer",
                    "&:hover": { color: brand.violet700 },
                  }}
                >
                  {user.full_name}
                </Typography>
                <IconButton
                  onClick={() => logout().then(() => navigate("/login"))}
                  size="small"
                  aria-label={he.logout}
                  sx={{
                    bgcolor: alpha("#dc2626", 0.1),
                    color: "error.main",
                    "&:hover": { bgcolor: alpha("#dc2626", 0.18) },
                  }}
                >
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>

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
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          px: { xs: 1.5, sm: 2.5 },
          pb: { xs: 2, sm: 3 },
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />
        <Box
          sx={{
            ...hebrewAlignRightSx,
            minWidth: 0,
            maxWidth: "100%",
            bgcolor: brand.white,
            borderRadius: { xs: 2, sm: 4 },
            p: { xs: 2, sm: 3 },
            border: `1px solid ${alpha(brand.violet500, 0.12)}`,
            boxShadow: `0 4px 24px ${alpha(brand.violet700, 0.08)}`,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

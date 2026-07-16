import { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { alpha, Box, CssBaseline, Drawer, Fab } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import SidebarDrawerContent from "./SidebarDrawerContent";
import { FeedbackProvider } from "../context/FeedbackContext";
import { useAuth } from "../context/AuthContext";
import { getMenuItems } from "../config/menuItems";
import { he } from "../i18n/he";
import { SIDEBAR_WIDTH } from "../constants/layout";
import { hebrewAlignRightSx } from "../styles/hebrewAlign";
import { brand } from "../theme/brand";
import { usePendingEnrollmentCount } from "../hooks/usePendingEnrollmentCount";
import { useSidebarVisibility } from "../hooks/useSidebarVisibility";

const drawerPaperSx = {
  boxSizing: "border-box" as const,
  width: SIDEBAR_WIDTH,
  height: "100vh",
  maxHeight: "100vh",
  overflow: "hidden",
  border: "none",
  bgcolor: "transparent",
};

const drawerTransition = (visible: boolean) => ({
  width: visible ? SIDEBAR_WIDTH : 0,
  transition: (theme: { transitions: { create: (p: string[], o: object) => string } }) =>
    theme.transitions.create(["width", "margin"], { duration: 225 }),
});

function SidebarToggleFab({
  visible,
  onClick,
  label,
  icon,
  display,
}: {
  visible: boolean;
  onClick: () => void;
  label: string;
  icon: "menu" | "open";
  display: object;
}) {
  if (!visible) return null;
  return (
    <Fab
      size="small"
      color="primary"
      aria-label={label}
      onClick={onClick}
      sx={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: (theme) => theme.zIndex.drawer + 1,
        display,
      }}
    >
      {icon === "menu" ? <MenuIcon /> : <MenuOpenIcon />}
    </Fab>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { visible: sidebarVisible, show: showSidebar, hide: hideSidebar } = useSidebarVisibility();
  const pendingCount = usePendingEnrollmentCount();

  const menuItems = useMemo(() => (user ? getMenuItems(user.role) : []), [user]);
  const badges = useMemo(
    () => ({ pendingEnrollments: pendingCount }),
    [pendingCount],
  );

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout().then(() => navigate("/login"));
  };

  const drawerProps = {
    menuItems,
    user,
    pathname: location.pathname,
    onNavigate: handleNavigation,
    onLogout: handleLogout,
    badges,
  };

  return (
    <FeedbackProvider>
      <Box sx={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden" }}>
        <CssBaseline />

        <SidebarToggleFab
          visible
          onClick={() => setMobileOpen(true)}
          label={he.mainMenu}
          icon="menu"
          display={{ xs: "inline-flex", sm: "none" }}
        />
        <SidebarToggleFab
          visible={!sidebarVisible}
          onClick={showSidebar}
          label={he.showSidebar}
          icon="open"
          display={{ xs: "none", sm: "inline-flex" }}
        />

        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": { ...drawerPaperSx, position: "fixed" },
          }}
        >
          <SidebarDrawerContent {...drawerProps} />
        </Drawer>

        <Drawer
          variant="permanent"
          anchor="left"
          open
          sx={{
            display: { xs: "none", sm: "block" },
            flexShrink: 0,
            order: 0,
            ...drawerTransition(sidebarVisible),
            "&.MuiDrawer-docked": {
              position: "relative",
              height: "100vh",
            },
            "& .MuiDrawer-paper": {
              ...drawerPaperSx,
              position: "relative",
              ...drawerTransition(sidebarVisible),
            },
          }}
        >
          {sidebarVisible ? (
            <SidebarDrawerContent {...drawerProps} onHideSidebar={hideSidebar} />
          ) : null}
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
            px: { xs: 1.5, sm: 2.5, md: 3.5 },
            py: { xs: 2, sm: 3 },
          }}
        >
          <Box
            sx={{
              ...hebrewAlignRightSx,
              minWidth: 0,
              maxWidth: "100%",
              bgcolor: alpha(brand.white, 0.92),
              backdropFilter: "blur(12px)",
              borderRadius: { xs: 3, sm: 4.5 },
              p: { xs: 2, sm: 3, md: 3.5 },
              border: `1px solid ${alpha(brand.violet500, 0.12)}`,
              boxShadow: `0 8px 32px ${alpha(brand.violet700, 0.07)}`,
              minHeight: { xs: "auto", sm: "calc(100vh - 48px)" },
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </FeedbackProvider>
  );
}

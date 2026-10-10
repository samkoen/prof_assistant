import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMediaQuery, type Theme } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { getHomePath, getMenuItems } from "../config/menuItems";
import { crumbsFor } from "../utils/pageCrumbs";
import { usePendingEnrollmentCount } from "./usePendingEnrollmentCount";
import { useRoleCredits } from "./useRoleCredits";
import { useSidebarVisibility } from "./useSidebarVisibility";

/** État du squelette connecté : menu, fil d'Ariane, crédits, visibilité de la barre latérale. */
export function useShellState() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebar = useSidebarVisibility();
  const pendingCount = usePendingEnrollmentCount();
  const { wallet } = useRoleCredits(user?.role);
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));

  const menuItems = useMemo(() => (user ? getMenuItems(user.role) : []), [user]);
  const homePath = user ? getHomePath(user.role) : "/";
  const crumbs = useMemo(() => crumbsFor(pathname, homePath), [pathname, homePath]);

  const content = {
    menuItems,
    user,
    pathname,
    onNavigate: (path: string) => {
      navigate(path);
      setMobileOpen(false);
    },
    onLogout: () => logout().then(() => navigate("/login")),
    badges: { pendingEnrollments: pendingCount },
  };
  const openDrawer = () => setMobileOpen(true);
  const onOpenMenu = isMobile ? openDrawer : sidebar.visible ? undefined : sidebar.show;

  return { content, crumbs, wallet, sidebar, mobileOpen, setMobileOpen, onOpenMenu };
}

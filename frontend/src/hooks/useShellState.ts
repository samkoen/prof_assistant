import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCreateActions } from "../config/createActions";
import { getHomePath, getMenuItems } from "../config/menuItems";
import { crumbsFor } from "../utils/pageCrumbs";
import { usePendingEnrollmentCount } from "./usePendingEnrollmentCount";
import { useRoleCredits } from "./useRoleCredits";
import { useSidebarVisibility } from "./useSidebarVisibility";

/** État du squelette connecté : menu, fil d'Ariane, crédits, création rapide, barre latérale. */
export function useShellState() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebar = useSidebarVisibility();
  const pendingCount = usePendingEnrollmentCount();
  const { wallet } = useRoleCredits(user?.role);

  const menuItems = useMemo(() => (user ? getMenuItems(user.role) : []), [user]);
  const createActions = useMemo(() => getCreateActions(user?.role), [user?.role]);
  const homePath = user ? getHomePath(user.role) : "/";
  const crumbs = useMemo(() => crumbsFor(pathname, homePath), [pathname, homePath]);
  const onNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const content = {
    menuItems,
    user,
    pathname,
    onNavigate,
    onLogout: () => logout().then(() => navigate("/login")),
    badges: { pendingEnrollments: pendingCount },
  };

  return {
    content,
    crumbs,
    wallet,
    sidebar,
    mobileOpen,
    setMobileOpen,
    createActions,
    onShowSidebar: sidebar.visible ? undefined : sidebar.show,
  };
}

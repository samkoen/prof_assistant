import { Box } from "@mui/material";
import type { User } from "../api/client";
import type { MenuItemDef } from "../config/menuItems";
import { sidebarGradient } from "../theme/brand";
import SidebarHeader from "./shell/SidebarHeader";
import SidebarMenu, { type MenuBadges } from "./shell/SidebarMenu";
import SidebarUserFooter from "./shell/SidebarUserFooter";

type SidebarDrawerContentProps = {
  menuItems: MenuItemDef[];
  user: User | null;
  pathname: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  onHideSidebar?: () => void;
  badges?: MenuBadges;
};

const rootSx = {
  height: "100%",
  maxHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  background: sidebarGradient,
} as const;

/** Contenu de la barre latérale : marque, navigation, compte utilisateur. */
export default function SidebarDrawerContent(props: SidebarDrawerContentProps) {
  const { menuItems, user, pathname, onNavigate, onLogout, onHideSidebar, badges } = props;
  return (
    <Box sx={rootSx}>
      <SidebarHeader onHideSidebar={onHideSidebar} />
      <SidebarMenu menuItems={menuItems} pathname={pathname} onNavigate={onNavigate} badges={badges} />
      {user && <SidebarUserFooter user={user} onNavigate={onNavigate} onLogout={onLogout} />}
    </Box>
  );
}

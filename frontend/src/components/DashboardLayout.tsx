import { Outlet } from "react-router-dom";
import { Box, CssBaseline } from "@mui/material";
import { FeedbackProvider } from "../context/FeedbackContext";
import { useShellState } from "../hooks/useShellState";
import AppTopBar from "./shell/AppTopBar";
import MobileBottomNav from "./shell/MobileBottomNav";
import ShellMain from "./shell/ShellMain";
import ShellSidebar from "./shell/ShellSidebar";

/** Squelette connecté : barre latérale (bureau), barre du bas (mobile), barre supérieure et contenu. */
export default function DashboardLayout() {
  const shell = useShellState();
  const { content } = shell;
  return (
    <FeedbackProvider>
      <Box sx={{ display: "flex", height: "100dvh", width: "100%", overflow: "hidden" }}>
        <CssBaseline />
        <ShellSidebar
          content={content}
          desktopVisible={shell.sidebar.visible}
          mobileOpen={shell.mobileOpen}
          onCloseMobile={() => shell.setMobileOpen(false)}
          onHideDesktop={shell.sidebar.hide}
        />
        <ShellMain
          topBar={<AppTopBar crumbs={shell.crumbs} wallet={shell.wallet} createActions={shell.createActions} onShowSidebar={shell.onShowSidebar} />}
        >
          <Outlet />
        </ShellMain>
        <MobileBottomNav
          menuItems={content.menuItems}
          pathname={content.pathname}
          badges={content.badges}
          onNavigate={content.onNavigate}
          onMore={() => shell.setMobileOpen(true)}
        />
      </Box>
    </FeedbackProvider>
  );
}

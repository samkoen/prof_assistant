import { Outlet } from "react-router-dom";
import { Box, CssBaseline } from "@mui/material";
import { FeedbackProvider } from "../context/FeedbackContext";
import { useShellState } from "../hooks/useShellState";
import AppTopBar from "./shell/AppTopBar";
import ShellMain from "./shell/ShellMain";
import ShellSidebar from "./shell/ShellSidebar";

/** Squelette connecté : barre latérale + barre supérieure + contenu de la route. */
export default function DashboardLayout() {
  const shell = useShellState();
  return (
    <FeedbackProvider>
      <Box sx={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden" }}>
        <CssBaseline />
        <ShellSidebar
          content={shell.content}
          desktopVisible={shell.sidebar.visible}
          mobileOpen={shell.mobileOpen}
          onCloseMobile={() => shell.setMobileOpen(false)}
          onHideDesktop={shell.sidebar.hide}
        />
        <ShellMain topBar={<AppTopBar crumbs={shell.crumbs} wallet={shell.wallet} onOpenMenu={shell.onOpenMenu} />}>
          <Outlet />
        </ShellMain>
      </Box>
    </FeedbackProvider>
  );
}

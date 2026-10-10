import type { ComponentProps } from "react";
import { Drawer } from "@mui/material";
import SidebarDrawerContent from "../SidebarDrawerContent";
import { SIDEBAR_WIDTH } from "../../constants/layout";

type ContentProps = ComponentProps<typeof SidebarDrawerContent>;

type ShellSidebarProps = {
  content: ContentProps;
  desktopVisible: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onHideDesktop: () => void;
};

const paperSx = {
  boxSizing: "border-box",
  width: SIDEBAR_WIDTH,
  height: "100vh",
  maxHeight: "100vh",
  overflow: "hidden",
  border: "none",
  bgcolor: "transparent",
} as const;

const widthTransition = (visible: boolean) => ({
  width: visible ? SIDEBAR_WIDTH : 0,
  transition: (theme: { transitions: { create: (p: string[], o: object) => string } }) =>
    theme.transitions.create(["width", "margin"], { duration: 225 }),
});

function MobileDrawer({ content, open, onClose }: { content: ContentProps; open: boolean; onClose: () => void }) {
  return (
    <Drawer
      variant="temporary"
      anchor="left"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ display: { xs: "block", sm: "none" }, "& .MuiDrawer-paper": { ...paperSx, position: "fixed" } }}
    >
      <SidebarDrawerContent {...content} />
    </Drawer>
  );
}

function DesktopDrawer({ content, visible, onHide }: { content: ContentProps; visible: boolean; onHide: () => void }) {
  return (
    <Drawer
      variant="permanent"
      anchor="left"
      open
      sx={{
        display: { xs: "none", sm: "block" },
        flexShrink: 0,
        order: 0,
        ...widthTransition(visible),
        "&.MuiDrawer-docked": { position: "relative", height: "100vh" },
        "& .MuiDrawer-paper": { ...paperSx, position: "relative", ...widthTransition(visible) },
      }}
    >
      {visible ? <SidebarDrawerContent {...content} onHideSidebar={onHide} /> : null}
    </Drawer>
  );
}

/** Navigation latérale : tiroir sur mobile, colonne repliable sur bureau. */
export default function ShellSidebar({ content, desktopVisible, mobileOpen, onCloseMobile, onHideDesktop }: ShellSidebarProps) {
  return (
    <>
      <MobileDrawer content={content} open={mobileOpen} onClose={onCloseMobile} />
      <DesktopDrawer content={content} visible={desktopVisible} onHide={onHideDesktop} />
    </>
  );
}

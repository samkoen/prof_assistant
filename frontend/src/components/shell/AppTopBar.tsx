import { Box, IconButton, Tooltip } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import type { WalletBalance } from "../../api/billing";
import type { CreateAction } from "../../config/createActions";
import type { Crumb } from "../../utils/pageCrumbs";
import { he } from "../../i18n/he";
import { brand, surface } from "../../theme/brand";
import AppBreadcrumbs from "./AppBreadcrumbs";
import CreateMenuButton from "./CreateMenuButton";
import TopBarCreditsChip from "./TopBarCreditsChip";

type AppTopBarProps = {
  crumbs: Crumb[];
  wallet: WalletBalance | null;
  createActions: CreateAction[];
  /** Ré-affiche la barre latérale masquée (bureau). Absent quand elle est visible. */
  onShowSidebar?: () => void;
};

const barSx = {
  position: "sticky",
  top: 0,
  zIndex: 10,
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  minHeight: 60,
  px: { xs: 1.5, sm: 3 },
  bgcolor: "rgba(255, 255, 255, 0.92)",
  backdropFilter: "blur(10px)",
  borderBottom: `1px solid ${surface.border}`,
} as const;

/** Barre supérieure : où je suis (fil d'Ariane), crédits AI et bouton de création. */
export default function AppTopBar({ crumbs, wallet, createActions, onShowSidebar }: AppTopBarProps) {
  return (
    <Box component="header" dir="rtl" sx={barSx}>
      {onShowSidebar && (
        <Tooltip title={he.showSidebar}>
          <IconButton onClick={onShowSidebar} aria-label={he.showSidebar} edge="start" sx={{ color: brand.slate600, display: { xs: "none", sm: "inline-flex" } }}>
            <MenuIcon />
          </IconButton>
        </Tooltip>
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <AppBreadcrumbs crumbs={crumbs} />
      </Box>
      {wallet && <TopBarCreditsChip wallet={wallet} />}
      {createActions.length > 0 && <CreateMenuButton actions={createActions} />}
    </Box>
  );
}

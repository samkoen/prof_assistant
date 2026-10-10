import { alpha, Box, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import type { WalletBalance } from "../../api/billing";
import type { Crumb } from "../../utils/pageCrumbs";
import { he } from "../../i18n/he";
import { brand } from "../../theme/brand";
import AppBreadcrumbs from "./AppBreadcrumbs";
import TopBarCreditsChip from "./TopBarCreditsChip";

type AppTopBarProps = {
  crumbs: Crumb[];
  wallet: WalletBalance | null;
  /** Ouvre le tiroir (mobile) ou ré-affiche la barre latérale masquée (bureau). */
  onOpenMenu?: () => void;
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
  bgcolor: alpha(brand.white, 0.85),
  backdropFilter: "blur(14px)",
  borderBottom: `1px solid ${alpha(brand.violet600, 0.1)}`,
} as const;

function MenuToggle({ onClick }: { onClick: () => void }) {
  return (
    <IconButton onClick={onClick} aria-label={he.mainMenu} edge="start" sx={{ color: brand.violet700 }}>
      <MenuIcon />
    </IconButton>
  );
}

/** Barre supérieure collante : orientation (fil d'Ariane) + solde de crédits. */
export default function AppTopBar({ crumbs, wallet, onOpenMenu }: AppTopBarProps) {
  return (
    <Box component="header" dir="rtl" sx={barSx}>
      {onOpenMenu && <MenuToggle onClick={onOpenMenu} />}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <AppBreadcrumbs crumbs={crumbs} />
      </Box>
      {wallet && <TopBarCreditsChip wallet={wallet} />}
    </Box>
  );
}

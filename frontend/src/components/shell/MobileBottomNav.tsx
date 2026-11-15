import { Badge, BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import type { MenuItemDef } from "../../config/menuItems";
import { he } from "../../i18n/he";
import { brand, surface } from "../../theme/brand";
import { isMenuItemSelected } from "../../utils/menuSelection";
import { isOutsideMobileNav, mobileNavItems } from "../../utils/navSections";
import type { MenuBadges } from "./SidebarMenu";

export const MOBILE_NAV_HEIGHT = 64;

type MobileBottomNavProps = {
  menuItems: MenuItemDef[];
  pathname: string;
  badges?: MenuBadges;
  onNavigate: (path: string) => void;
  onMore: () => void;
};

const MORE = "__more__";

const paperSx = {
  display: { xs: "block", sm: "none" },
  position: "fixed",
  insetInline: 0,
  bottom: 0,
  zIndex: 1100,
  borderTop: `1px solid ${surface.border}`,
  borderRadius: 0,
  pb: "env(safe-area-inset-bottom)",
} as const;

const actionSx = {
  minWidth: 0,
  px: 0.5,
  color: brand.slate600,
  "&.Mui-selected": { color: brand.primary700 },
  "& .MuiBottomNavigationAction-label": { fontSize: "0.72rem", fontWeight: 600, "&.Mui-selected": { fontSize: "0.72rem" } },
} as const;

function moreBadge(menuItems: MenuItemDef[], tabs: MenuItemDef[], badges?: MenuBadges): number {
  return menuItems
    .filter((item) => !tabs.includes(item) && item.badgeKey)
    .reduce((sum, item) => sum + (badges?.[item.badgeKey!] ?? 0), 0);
}

/** Navigation mobile : 3-4 onglets principaux + « עוד » qui ouvre le menu complet. */
export default function MobileBottomNav({ menuItems, pathname, badges, onNavigate, onMore }: MobileBottomNavProps) {
  const tabs = mobileNavItems(menuItems);
  const active = tabs.map((item) => isMenuItemSelected(item, pathname));
  const value = isOutsideMobileNav(active) ? MORE : tabs[active.indexOf(true)].path;
  const extra = moreBadge(menuItems, tabs, badges);
  return (
    <Paper component="nav" aria-label={he.navMobileLabel} elevation={0} sx={paperSx}>
      <BottomNavigation showLabels value={value} sx={{ height: MOBILE_NAV_HEIGHT }} onChange={(_, next: string) => (next === MORE ? onMore() : onNavigate(next))}>
        {tabs.map((item) => (
          <BottomNavigationAction key={item.path} value={item.path} label={item.mobileLabel} icon={item.icon} sx={actionSx} />
        ))}
        <BottomNavigationAction
          value={MORE}
          label={he.navMore}
          icon={<Badge color="primary" badgeContent={extra} max={99}><MoreHorizIcon /></Badge>}
          sx={actionSx}
        />
      </BottomNavigation>
    </Paper>
  );
}

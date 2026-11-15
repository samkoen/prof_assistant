import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, ListSubheader } from "@mui/material";
import type { MenuItemDef, MenuSection } from "../../config/menuItems";
import { he } from "../../i18n/he";
import { brand, surface } from "../../theme/brand";
import { isMenuItemSelected } from "../../utils/menuSelection";
import { groupNavItems } from "../../utils/navSections";

export type MenuBadges = Partial<Record<NonNullable<MenuItemDef["badgeKey"]>, number>>;

type SidebarMenuProps = {
  menuItems: MenuItemDef[];
  pathname: string;
  onNavigate: (path: string) => void;
  badges?: MenuBadges;
};

const SECTION_TITLES: Record<MenuSection, string | null> = {
  main: null,
  manage: he.navSectionManage,
  account: null,
};

const listSx = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
  overscrollBehavior: "contain",
  px: 1.5,
  py: 1.5,
  scrollbarWidth: "thin",
} as const;

const buttonSx = {
  borderRadius: 2,
  minHeight: 40,
  py: 0.75,
  px: 1.25,
  color: brand.slate700,
  "& .MuiListItemIcon-root": { minWidth: 34, color: brand.slate400 },
  "&:hover": { bgcolor: surface.hover, color: brand.slate900 },
  "&.Mui-selected": {
    bgcolor: brand.primary50,
    color: brand.primary700,
    "&:hover": { bgcolor: brand.primary100 },
    "& .MuiListItemIcon-root": { color: brand.primary600 },
  },
} as const;

const subheaderSx = {
  bgcolor: "transparent",
  color: brand.slate400,
  fontSize: "0.72rem",
  fontWeight: 700,
  letterSpacing: "0.04em",
  lineHeight: "32px",
  px: 1.25,
  mt: 1.5,
} as const;

function badgeCount(item: MenuItemDef, badges?: MenuBadges): number {
  if (!item.badgeKey || !badges) return 0;
  return badges[item.badgeKey] ?? 0;
}

function CountBadge({ count }: { count: number }) {
  return (
    <Box
      component="span"
      sx={{ minWidth: 22, height: 20, px: 0.75, borderRadius: 999, bgcolor: brand.primary600, color: brand.white, fontSize: "0.72rem", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
    >
      {count > 99 ? "99+" : count}
    </Box>
  );
}

function NavEntry({ item, selected, badge, onNavigate }: {
  item: MenuItemDef;
  selected: boolean;
  badge: number;
  onNavigate: (path: string) => void;
}) {
  return (
    <ListItem disablePadding sx={{ mb: 0.25 }}>
      <ListItemButton selected={selected} onClick={() => onNavigate(item.path)} sx={buttonSx} aria-current={selected ? "page" : undefined}>
        <ListItemIcon>{item.icon}</ListItemIcon>
        <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: "0.92rem", fontWeight: selected ? 600 : 500, noWrap: true }} />
        {badge > 0 && <CountBadge count={badge} />}
      </ListItemButton>
    </ListItem>
  );
}

/** Navigation latérale groupée : tâches principales, puis gestion, puis aide. */
export default function SidebarMenu({ menuItems, pathname, onNavigate, badges }: SidebarMenuProps) {
  return (
    <List component="nav" sx={listSx} aria-label={he.mainMenu}>
      {groupNavItems(menuItems).map((group) => (
        <Box key={group.section} component="li" sx={{ listStyle: "none", mt: group.section === "account" ? 1.5 : 0 }}>
          <Box component="ul" sx={{ p: 0, m: 0 }}>
            {SECTION_TITLES[group.section] && <ListSubheader sx={subheaderSx}>{SECTION_TITLES[group.section]}</ListSubheader>}
            {group.items.map((item) => (
              <NavEntry key={item.path} item={item} selected={isMenuItemSelected(item, pathname)} badge={badgeCount(item, badges)} onNavigate={onNavigate} />
            ))}
          </Box>
        </Box>
      ))}
    </List>
  );
}

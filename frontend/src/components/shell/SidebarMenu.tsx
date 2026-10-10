import { alpha, Chip, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import type { MenuItemDef } from "../../config/menuItems";
import { brand } from "../../theme/brand";
import { isMenuItemSelected } from "../../utils/menuSelection";

export type MenuBadges = Partial<Record<NonNullable<MenuItemDef["badgeKey"]>, number>>;

type SidebarMenuProps = {
  menuItems: MenuItemDef[];
  pathname: string;
  onNavigate: (path: string) => void;
  badges?: MenuBadges;
};

const listSx = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
  overscrollBehavior: "contain",
  px: 1.5,
  py: 2,
  scrollbarWidth: "thin",
  scrollbarColor: `${alpha(brand.white, 0.25)} transparent`,
} as const;

const buttonSx = {
  borderRadius: 2.5,
  py: 1.1,
  color: alpha(brand.white, 0.78),
  transition: "background-color 0.15s ease, color 0.15s ease",
  "& .MuiListItemIcon-root": { minWidth: 38, color: alpha(brand.white, 0.6) },
  "&:hover": { bgcolor: alpha(brand.white, 0.09), color: brand.white },
  "&.Mui-selected": {
    bgcolor: alpha(brand.white, 0.17),
    color: brand.white,
    "&:hover": { bgcolor: alpha(brand.white, 0.21) },
    "& .MuiListItemIcon-root": { color: brand.sky500 },
  },
} as const;

function badgeCount(item: MenuItemDef, badges?: MenuBadges): number {
  if (!item.badgeKey || !badges) return 0;
  return badges[item.badgeKey] ?? 0;
}

function CountBadge({ count }: { count: number }) {
  return (
    <Chip
      size="small"
      label={count > 99 ? "99+" : count}
      sx={{ height: 22, minWidth: 22, fontSize: "0.72rem", fontWeight: 800, bgcolor: brand.amber500, color: brand.slate900 }}
    />
  );
}

function NavEntry({ item, selected, badge, onNavigate }: {
  item: MenuItemDef;
  selected: boolean;
  badge: number;
  onNavigate: (path: string) => void;
}) {
  return (
    <ListItem disablePadding sx={{ mb: 0.5 }}>
      <ListItemButton selected={selected} onClick={() => onNavigate(item.path)} sx={buttonSx} aria-current={selected ? "page" : undefined}>
        <ListItemIcon>{item.icon}</ListItemIcon>
        <ListItemText
          primary={item.text}
          primaryTypographyProps={{ fontSize: "0.93rem", fontWeight: selected ? 700 : 500, noWrap: true }}
        />
        {badge > 0 && <CountBadge count={badge} />}
      </ListItemButton>
    </ListItem>
  );
}

export default function SidebarMenu({ menuItems, pathname, onNavigate, badges }: SidebarMenuProps) {
  return (
    <List component="nav" sx={listSx}>
      {menuItems.map((item) => (
        <NavEntry
          key={item.path}
          item={item}
          selected={isMenuItemSelected(item, pathname)}
          badge={badgeCount(item, badges)}
          onNavigate={onNavigate}
        />
      ))}
    </List>
  );
}

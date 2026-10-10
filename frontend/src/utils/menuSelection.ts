import type { MenuItemDef } from "../config/menuItems";

const ROLE_HOME_PATHS = ["/admin", "/teacher", "/student"];

function isRoleHome(path: string): boolean {
  return ROLE_HOME_PATHS.includes(path);
}

/**
 * Un élément du menu est actif sur sa page et sur ses sous-pages
 * (ex. « מבחנים » reste actif sur /teacher/exams/12/edit). L'accueil
 * du rôle n'est actif que sur sa propre URL.
 */
export function isMenuItemSelected(item: Pick<MenuItemDef, "path" | "matchPathPrefix">, pathname: string): boolean {
  if (item.matchPathPrefix) return pathname.startsWith(item.matchPathPrefix);
  if (pathname === item.path) return true;
  if (isRoleHome(item.path)) return false;
  return pathname.startsWith(`${item.path}/`);
}

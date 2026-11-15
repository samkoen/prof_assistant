import type { MenuSection } from "../config/menuItems";

type NavLike = { path: string; section?: MenuSection; mobileLabel?: string };

export type NavGroup<T extends NavLike> = { section: MenuSection; items: T[] };

const SECTION_ORDER: MenuSection[] = ["main", "manage", "account"];

/** Maximum d'onglets dans la barre du bas, hors bouton « עוד ». */
export const MOBILE_NAV_MAX = 4;

/** Regroupe les entrées par section, dans l'ordre fixe main → manage → account ; sections vides omises. */
export function groupNavItems<T extends NavLike>(items: T[]): NavGroup<T>[] {
  return SECTION_ORDER.map((section) => ({
    section,
    items: items.filter((item) => (item.section ?? "main") === section),
  })).filter((group) => group.items.length > 0);
}

/** Entrées de la barre de navigation mobile : celles qui ont un libellé court, dans la limite. */
export function mobileNavItems<T extends NavLike>(items: T[]): T[] {
  return items.filter((item) => Boolean(item.mobileLabel)).slice(0, MOBILE_NAV_MAX);
}

/** Vrai si la page courante n'est couverte par aucun onglet mobile (le bouton « עוד » est alors actif). */
export function isOutsideMobileNav(activePaths: boolean[]): boolean {
  return !activePaths.some(Boolean);
}

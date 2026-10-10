/** Géométrie du spinner marque — testable sans React. */
export type BrandSpinnerMetrics = {
  trackWidth: number;
  hole: number;
  jewel: number;
  holeInset: number;
  iconSize: number;
  /** Anneau intérieur (tourne en sens inverse). */
  innerInset: number;
  innerTrackWidth: number;
  /** Au-dessus de ce seuil, le cœur affiche l'étincelle ; en dessous, un simple point. */
  showIcon: boolean;
};

const ICON_MIN_SIZE = 48;
/** Taille à partir de laquelle on utilise le spinner « orbite » ; en dessous, trois points. */
export const ORBIT_MIN_SIZE = 32;

export function brandSpinnerMetrics(size: number): BrandSpinnerMetrics {
  const trackWidth = Math.max(3, Math.round(size * 0.09));
  const hole = size - trackWidth * 2;
  const jewel = Math.round(hole * 0.62);
  const holeInset = (size - hole) / 2;
  const iconSize = Math.round(jewel * 0.52);
  const innerInset = Math.round(size * 0.2);
  const innerTrackWidth = Math.max(2, Math.round(size * 0.06));
  return { trackWidth, hole, jewel, holeInset, iconSize, innerInset, innerTrackWidth, showIcon: size >= ICON_MIN_SIZE };
}

/** Variante de spinner selon la taille demandée. */
export function spinnerVariant(size: number): "orbit" | "dots" {
  return size >= ORBIT_MIN_SIZE ? "orbit" : "dots";
}

/** Taille d'un point pour la variante compacte (3 points tiennent dans `size`). */
export function dotSize(size: number): number {
  return Math.max(4, Math.round(size * 0.26));
}

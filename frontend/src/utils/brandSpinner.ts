/** Géométrie du spinner marque — testable sans React. */
export type BrandSpinnerMetrics = {
  trackWidth: number;
  hole: number;
  jewel: number;
  holeInset: number;
  iconSize: number;
};

export function brandSpinnerMetrics(size: number): BrandSpinnerMetrics {
  const trackWidth = Math.max(3, Math.round(size * 0.09));
  const hole = size - trackWidth * 2;
  const jewel = Math.round(hole * 0.62);
  const holeInset = (size - hole) / 2;
  const iconSize = Math.round(jewel * 0.52);
  return { trackWidth, hole, jewel, holeInset, iconSize };
}

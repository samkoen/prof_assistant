import type { ReactNode } from "react";

export interface DataListColumnDef<T> {
  key: string;
  label: string;
  minWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  /** Direction du contenu (email → ltr). Défaut : rtl. */
  cellDir?: "ltr" | "rtl";
  /** Valeur texte pour tri / filtre */
  getValue?: (row: T) => string;
  renderCell: (row: T) => ReactNode;
}

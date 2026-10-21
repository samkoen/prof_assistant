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
  /** Valeur de tri (nombre pour dates / montants) ; défaut : getValue. */
  getSortValue?: (row: T) => string | number;
  renderCell: (row: T) => ReactNode;
}

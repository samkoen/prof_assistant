import type { ReactNode } from "react";

export interface DataListColumnDef<T> {
  key: string;
  label: string;
  minWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  /** Valeur texte pour tri / filtre */
  getValue?: (row: T) => string;
  renderCell: (row: T) => ReactNode;
}

import { useState, type ReactNode } from "react";
import { Box, Button, Card, Typography } from "@mui/material";
import { he } from "../../i18n/he";
import { brand } from "../../theme/brand";
import type { DataListColumnDef } from "./types";

type DataListMobileListProps<T> = {
  rows: T[];
  columns: DataListColumnDef<T>[];
  emptyMessage: string;
  getRowId: (row: T) => string | number;
  renderActions?: (row: T) => ReactNode;
};

const PAGE = 20;

function FieldLine<T>({ col, row }: { col: DataListColumnDef<T>; row: T }) {
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "baseline", minWidth: 0 }}>
      <Typography variant="caption" sx={{ color: brand.slate600, flexShrink: 0, minWidth: 84 }}>
        {col.label}
      </Typography>
      <Box dir={col.cellDir ?? "rtl"} sx={{ minWidth: 0, fontSize: "0.875rem", overflowWrap: "anywhere" }}>
        {col.renderCell(row)}
      </Box>
    </Box>
  );
}

function RowCard<T>({ row, columns, renderActions }: { row: T; columns: DataListColumnDef<T>[]; renderActions?: (row: T) => ReactNode }) {
  const [first, ...rest] = columns;
  return (
    <Card sx={{ p: 1.75, display: "flex", flexDirection: "column", gap: 0.75 }}>
      {first && <Box sx={{ fontWeight: 600, minWidth: 0 }}>{first.renderCell(row)}</Box>}
      {rest.map((col) => (
        <FieldLine key={col.key} col={col} row={row} />
      ))}
      {renderActions && <Box sx={{ mt: 0.75, display: "flex", justifyContent: "flex-start" }}>{renderActions(row)}</Box>}
    </Card>
  );
}

/** Variante mobile du tableau : une carte par ligne, première colonne en titre, actions en bas. */
export default function DataListMobileList<T>({ rows, columns, emptyMessage, getRowId, renderActions }: DataListMobileListProps<T>) {
  const [shown, setShown] = useState(PAGE);
  if (rows.length === 0) {
    return (
      <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
        {emptyMessage}
      </Typography>
    );
  }
  return (
    <Box dir="rtl" sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      {rows.slice(0, shown).map((row) => (
        <RowCard key={getRowId(row)} row={row} columns={columns} renderActions={renderActions} />
      ))}
      {rows.length > shown && (
        <Button variant="outlined" onClick={() => setShown((n) => n + PAGE)}>
          {he.showMore} ({rows.length - shown})
        </Button>
      )}
    </Box>
  );
}

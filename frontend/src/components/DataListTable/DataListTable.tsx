import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Box,
  Button,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import {
  LIST_TABLE_SCROLL_MAX_HEIGHT,
  TABLE_ACTIONS_COLUMN_PX,
} from "../../constants/layout";
import { he } from "../../i18n/he";
import { hebrewDataListTableSx } from "../../styles/hebrewAlign";
import {
  computeResizablePixelWidths,
  defaultEqualFractions,
  loadColumnWidthsPx,
  loadVisibleColumnKeys,
  saveColumnWidthsPx,
  saveVisibleColumnKeys,
} from "../../utils/tableLayoutUtils";
import { AlignedTableCell, ResizableHeaderCell } from "../ResizableTableColumns/ResizableHeaderCell";
import ColumnPickerDialog from "./ColumnPickerDialog";
import type { DataListColumnDef } from "./types";

const headerSx = { fontSize: "0.75rem", fontWeight: 600 };

const hideHorizontalScrollbarSx = {
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  "&::-webkit-scrollbar": { display: "none" },
} as const;

export interface DataListTableProps<T> {
  viewKey: string;
  rows: T[];
  columns: DataListColumnDef<T>[];
  loading?: boolean;
  emptyMessage?: string;
  getRowId: (row: T) => string | number;
  renderActions?: (row: T) => ReactNode;
  toolbarExtra?: ReactNode;
  /** Largeur colonne actions (défaut : TABLE_ACTIONS_COLUMN_PX). */
  actionsColumnPx?: number;
}

function compareValues(a: string, b: string, order: "asc" | "desc"): number {
  const cmp = a.localeCompare(b, "he", { numeric: true, sensitivity: "base" });
  return order === "asc" ? cmp : -cmp;
}

export default function DataListTable<T>({
  viewKey,
  rows,
  columns,
  loading = false,
  emptyMessage = he.noData,
  getRowId,
  renderActions,
  toolbarExtra,
  actionsColumnPx = TABLE_ACTIONS_COLUMN_PX,
}: DataListTableProps<T>) {
  const widthsStorageKey = `assistant.table.${viewKey}.widths`;
  const columnsStorageKey = `assistant.table.${viewKey}.columns`;

  const defaultVisibleKeys = useMemo(() => columns.map((c) => c.key), [columns]);
  const [visibleKeys, setVisibleKeys] = useState<string[]>(() =>
    loadVisibleColumnKeys(columnsStorageKey, defaultVisibleKeys)
  );
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [debouncedFilters, setDebouncedFilters] = useState<Record<string, string>>({});
  const [orderBy, setOrderBy] = useState<string>(columns[0]?.key ?? "");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [colWidthsPx, setColWidthsPx] = useState<Record<string, number> | null>(null);
  const [tableWidth, setTableWidth] = useState(0);
  const tableWidthRef = useRef(1200);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const headerScrollRef = useRef<HTMLDivElement | null>(null);
  const bodyScrollRef = useRef<HTMLDivElement | null>(null);

  const visibleColumns = useMemo(
    () => columns.filter((c) => visibleKeys.includes(c.key)),
    [columns, visibleKeys]
  );

  const resizableOrder = useMemo(() => visibleColumns.map((c) => c.key), [visibleColumns]);

  const minPx = useMemo(
    () =>
      Object.fromEntries(
        visibleColumns.map((c) => [c.key, c.minWidth ?? (c.key.length > 8 ? 120 : 90)])
      ),
    [visibleColumns]
  );

  const setTableContainerRef = useCallback((el: HTMLDivElement | null) => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
    if (!el) return;
    const w0 = Math.floor(el.getBoundingClientRect().width);
    if (w0 > 0) {
      setTableWidth(w0);
      tableWidthRef.current = w0;
    }
    const ro = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0].contentRect.width);
      if (w > 0) {
        setTableWidth(w);
        tableWidthRef.current = w;
      }
    });
    ro.observe(el);
    resizeObserverRef.current = ro;
  }, []);

  const hasActions = Boolean(renderActions);
  const actionsPx = hasActions ? actionsColumnPx : 0;

  const { fullWidths, tableMinW, fitContainer } = useMemo((): {
    fullWidths: Record<string, number>;
    tableMinW: number;
    fitContainer: boolean;
  } => {
    const w = tableWidth > 0 ? tableWidth : tableWidthRef.current;
    const W = Math.max(200, w);
    if (colWidthsPx) {
      const sum = resizableOrder.reduce((a, k) => a + (colWidthsPx[k] || 0), 0);
      const fw: Record<string, number> = { ...colWidthsPx };
      if (hasActions) fw.actions = actionsPx;
      return {
        fullWidths: fw,
        tableMinW: Math.max(W, sum + actionsPx),
        fitContainer: sum + actionsPx <= W + 2,
      };
    }
    const frac = defaultEqualFractions(resizableOrder);
    const o = computeResizablePixelWidths(frac, w, minPx, resizableOrder, actionsPx);
    const fw: Record<string, number> = { ...o.colWidths };
    if (hasActions) fw.actions = o.actions;
    return {
      fullWidths: fw,
      tableMinW: o.tableMinWidth,
      fitContainer: !o.overflow,
    };
  }, [tableWidth, colWidthsPx, resizableOrder, minPx, hasActions, actionsPx]);

  const getPairMaxW = useCallback(
    (key: string) => {
      const i = resizableOrder.indexOf(key);
      if (i < 0 || i >= resizableOrder.length - 1) return 4000;
      const b = resizableOrder[i + 1];
      const minB = minPx[b] ?? 64;
      return fullWidths[key] + fullWidths[b] - minB;
    },
    [fullWidths, resizableOrder, minPx]
  );

  const setColWidth = useCallback(
    (key: string) => (newAPx: number) => {
      setColWidthsPx((prev) => {
        if (!prev) return prev;
        const i = resizableOrder.indexOf(key);
        if (i < 0 || i >= resizableOrder.length - 1) return prev;
        const a = key;
        const b = resizableOrder[i + 1];
        const minA = minPx[a] ?? 64;
        const minB = minPx[b] ?? 64;
        const pair = (prev[a] || 0) + (prev[b] || 0);
        const newA = Math.max(minA, Math.min(newAPx, pair - minB));
        const newB = pair - newA;
        if (newA === prev[a] && newB === prev[b]) return prev;
        return { ...prev, [a]: newA, [b]: newB };
      });
    },
    [resizableOrder, minPx]
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilters({ ...filters }), 400);
    return () => clearTimeout(t);
  }, [filters]);

  useEffect(() => {
    if (tableWidth < 1 || colWidthsPx !== null || !resizableOrder.length) return;
    const W = Math.max(200, tableWidth);
    const saved = loadColumnWidthsPx(widthsStorageKey, resizableOrder);
    if (saved) {
      const s0 = resizableOrder.reduce((a, k) => a + (saved[k] || 0), 0);
      if (s0 < 1) {
        setColWidthsPx(
          computeResizablePixelWidths(
            defaultEqualFractions(resizableOrder),
            W,
            minPx,
            resizableOrder,
            actionsPx
          ).colWidths
        );
        return;
      }
      const frac = Object.fromEntries(
        resizableOrder.map((k) => [k, (saved[k] || 0) / s0])
      );
      setColWidthsPx(
        computeResizablePixelWidths(frac, W, minPx, resizableOrder, actionsPx).colWidths
      );
    } else {
      setColWidthsPx(
        computeResizablePixelWidths(
          defaultEqualFractions(resizableOrder),
          W,
          minPx,
          resizableOrder,
          actionsPx
        ).colWidths
      );
    }
  }, [tableWidth, colWidthsPx, resizableOrder, minPx, widthsStorageKey, actionsPx]);

  useEffect(() => {
    if (!colWidthsPx || !resizableOrder.length) return;
    saveColumnWidthsPx(widthsStorageKey, resizableOrder, colWidthsPx);
  }, [colWidthsPx, resizableOrder, widthsStorageKey]);

  const filteredSorted = useMemo(() => {
    let list = [...rows];
    for (const col of visibleColumns) {
      if (!col.filterable) continue;
      const q = (debouncedFilters[col.key] ?? "").trim().toLowerCase();
      if (!q) continue;
      list = list.filter((row) =>
        (col.getValue?.(row) ?? "").toLowerCase().includes(q)
      );
    }
    const sortCol = visibleColumns.find((c) => c.key === orderBy && c.sortable !== false);
    if (sortCol) {
      list.sort((a, b) =>
        compareValues(sortCol.getValue?.(a) ?? "", sortCol.getValue?.(b) ?? "", order)
      );
    }
    return list;
  }, [rows, visibleColumns, debouncedFilters, orderBy, order]);

  const pagedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredSorted.slice(start, start + rowsPerPage);
  }, [filteredSorted, page, rowsPerPage]);

  const handleSort = (key: string) => {
    if (orderBy !== key) setPage(0);
    const isAsc = orderBy === key && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(key);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v.trim() !== "");
  const clearFilters = () => {
    setFilters({});
    setDebouncedFilters({});
    setPage(0);
  };

  const nDataCols = resizableOrder.length;
  const zBase = 20;

  const effectiveTableMinW = fitContainer ? "100%" : tableMinW;

  const tableSx = {
    tableLayout: "fixed" as const,
    width: fitContainer ? "100%" : "max-content",
    minWidth: effectiveTableMinW,
    ...hebrewDataListTableSx,
  };

  const syncBodyScrollLeft = () => {
    const body = bodyScrollRef.current;
    const header = headerScrollRef.current;
    if (body && header) header.scrollLeft = body.scrollLeft;
  };

  const syncHeaderScrollLeft = () => {
    const body = bodyScrollRef.current;
    const header = headerScrollRef.current;
    if (body && header) body.scrollLeft = header.scrollLeft;
  };

  return (
    <Box
      ref={setTableContainerRef}
      sx={{
        width: "100%",
        minWidth: 0,
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      <Box display="flex" flexWrap="wrap" gap={1} alignItems="center" sx={{ mb: 2 }}>
        {hasActiveFilters && (
          <Button variant="outlined" size="small" onClick={clearFilters}>
            {he.resetFilters}
          </Button>
        )}
        <Button
          variant="outlined"
          size="small"
          startIcon={<ViewColumnIcon />}
          onClick={() => setColumnPickerOpen(true)}
        >
          {he.tableColumns}
        </Button>
        {toolbarExtra}
      </Box>

      <Paper
        elevation={2}
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "100%",
          maxHeight: LIST_TABLE_SCROLL_MAX_HEIGHT,
          overflow: "hidden",
        }}
      >
        <Box
          ref={headerScrollRef}
          onScroll={syncHeaderScrollLeft}
          sx={{
            flexShrink: 0,
            overflowX: "auto",
            overflowY: "hidden",
            maxWidth: "100%",
            borderBottom: 1,
            borderColor: "divider",
            ...hideHorizontalScrollbarSx,
          }}
        >
          <Table size="small" sx={tableSx}>
            <TableHead sx={{ "& .MuiTableRow-root": { overflow: "visible" } }}>
              <TableRow>
                {resizableOrder.map((colKey, idx) => {
                  const col = visibleColumns.find((c) => c.key === colKey)!;
                  const last = idx === nDataCols - 1 && !hasActions;
                  return (
                    <ResizableHeaderCell
                      key={colKey}
                      width={fullWidths[colKey]}
                      onWidthChange={setColWidth(colKey)}
                      minWidth={minPx[colKey] ?? 64}
                      maxWidth={getPairMaxW(colKey)}
                      resizable={!last}
                      stackZIndex={zBase - idx}
                      sx={headerSx}
                    >
                      {col.sortable !== false ? (
                        <TableSortLabel
                          active={orderBy === colKey}
                          direction={orderBy === colKey ? order : "asc"}
                          onClick={() => handleSort(colKey)}
                        >
                          {col.label}
                        </TableSortLabel>
                      ) : (
                        col.label
                      )}
                    </ResizableHeaderCell>
                  );
                })}
                {hasActions && (
                  <ResizableHeaderCell
                    width={fullWidths.actions ?? actionsPx}
                    resizable={false}
                    align="right"
                    stackZIndex={0}
                    sx={headerSx}
                  >
                    {he.actions}
                  </ResizableHeaderCell>
                )}
              </TableRow>
              <TableRow>
                {resizableOrder.map((colKey) => {
                  const col = visibleColumns.find((c) => c.key === colKey)!;
                  return (
                    <AlignedTableCell
                      key={`f-${colKey}`}
                      width={fullWidths[colKey]}
                      dense
                      cellDir={col.cellDir ?? "rtl"}
                    >
                      {col.filterable !== false ? (
                        <TextField
                          size="small"
                          fullWidth
                          placeholder={he.filterPlaceholder}
                          value={filters[colKey] ?? ""}
                          onChange={(e) => {
                            setPage(0);
                            setFilters((prev) => ({ ...prev, [colKey]: e.target.value }));
                          }}
                          inputProps={{ sx: { fontSize: "0.8rem", py: 0.5 } }}
                        />
                      ) : null}
                    </AlignedTableCell>
                  );
                })}
                {hasActions && (
                  <TableCell
                    padding="none"
                    sx={{
                      width: fullWidths.actions ?? actionsPx,
                      minWidth: fullWidths.actions ?? actionsPx,
                      maxWidth: fullWidths.actions ?? actionsPx,
                    }}
                  />
                )}
              </TableRow>
            </TableHead>
          </Table>
        </Box>
        <Box
          ref={bodyScrollRef}
          onScroll={syncBodyScrollLeft}
          sx={{
            position: "relative",
            flex: "1 1 auto",
            minHeight: 0,
            overflowX: "auto",
            overflowY: "auto",
            maxWidth: "100%",
          }}
        >
          {loading && (
            <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 2 }} />
          )}
          <Table size="small" sx={tableSx}>
            <TableBody>
              {pagedRows.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={nDataCols + (hasActions ? 1 : 0)} align="center">
                    <Typography color="text.secondary" py={2}>
                      {emptyMessage}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {pagedRows.map((row) => (
                <TableRow key={getRowId(row)} hover>
                  {resizableOrder.map((colKey) => {
                    const col = visibleColumns.find((c) => c.key === colKey)!;
                    return (
                      <AlignedTableCell
                        key={colKey}
                        width={fullWidths[colKey]}
                        cellDir={col.cellDir ?? "rtl"}
                      >
                        {col.renderCell(row)}
                      </AlignedTableCell>
                    );
                  })}
                  {hasActions && (
                    <AlignedTableCell width={fullWidths.actions ?? actionsPx} align="right">
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          flexWrap: "nowrap",
                          gap: 0,
                        }}
                      >
                        {renderActions!(row)}
                      </Box>
                    </AlignedTableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        <TablePagination
          component="div"
          sx={{ flexShrink: 0, borderTop: 1, borderColor: "divider" }}
          count={filteredSorted.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage={he.rowsPerPage}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} ${he.of} ${count !== -1 ? count : `>${to}`}`
          }
        />
      </Paper>

      <ColumnPickerDialog
        open={columnPickerOpen}
        onClose={() => setColumnPickerOpen(false)}
        columns={columns as DataListColumnDef<unknown>[]}
        visibleKeys={visibleKeys}
        onSave={(keys) => {
          setVisibleKeys(keys);
          saveVisibleColumnKeys(columnsStorageKey, keys);
          setColWidthsPx(null);
          setColumnPickerOpen(false);
        }}
      />
    </Box>
  );
}

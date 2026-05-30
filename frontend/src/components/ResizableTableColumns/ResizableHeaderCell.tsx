import { useLayoutEffect, useRef } from "react";
import { Box, TableCell, type TableCellProps } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const num = (x: unknown, fallback: number) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
};

const RIGHT_GUTTER_PX = 6;
const RESIZE_HIT_PX = 4;
const LINE_INSET_FROM_RIGHT = 3;

export interface ResizableHeaderCellProps extends TableCellProps {
  width: number;
  onWidthChange?: (w: number) => void;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  showRightSeparator?: boolean;
  stackZIndex?: number;
}

export function ResizableHeaderCell({
  width,
  onWidthChange = () => {},
  minWidth: minW = 64,
  maxWidth: maxW = 800,
  resizable: resizableProp = true,
  showRightSeparator = true,
  stackZIndex = 1,
  children,
  sx: sxProps,
  ...tableCellProps
}: ResizableHeaderCellProps) {
  const theme = useTheme();
  const isRtl = theme.direction === "rtl";
  const rightGutter = showRightSeparator ? RIGHT_GUTTER_PX : 0;
  const w = num(width, minW);
  const maxWNum = num(maxW, 8000);
  const maxSafe = Math.max(maxWNum, minW);
  const onWidthChangeRef = useRef(onWidthChange);
  const widthRef = useRef(w);
  const minRef = useRef(minW);
  const maxRef = useRef(maxSafe);

  useLayoutEffect(() => {
    onWidthChangeRef.current = onWidthChange;
  }, [onWidthChange]);
  useLayoutEffect(() => {
    widthRef.current = w;
    minRef.current = minW;
    maxRef.current = maxSafe;
  }, [w, minW, maxSafe]);

  const handleRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ move: ((ev: MouseEvent) => void) | null; up: (() => void) | null }>({
    move: null,
    up: null,
  });
  const onMouseDownRef = useRef((e: MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startW0 = widthRef.current;
    const startMin = minRef.current;
    const startMax = maxRef.current;
    const deltaSign = isRtl ? -1 : 1;

    const onMove = (ev: MouseEvent) => {
      const next = Math.round(
        clamp(startW0 + deltaSign * (ev.clientX - startX), startMin, startMax)
      );
      onWidthChangeRef.current(next);
    };

    const onUp = () => {
      const d = dragRef.current;
      if (d.move) window.removeEventListener("mousemove", d.move, true);
      if (d.up) window.removeEventListener("mouseup", d.up, true);
      dragRef.current = { move: null, up: null };
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };

    dragRef.current = { move: onMove, up: onUp };
    window.addEventListener("mousemove", onMove, true);
    window.addEventListener("mouseup", onUp, true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  });

  useLayoutEffect(() => {
    const el = handleRef.current;
    if (!el || !resizableProp) return;
    const nativeDown = (e: MouseEvent) => onMouseDownRef.current(e);
    el.addEventListener("mousedown", nativeDown, true);
    return () => el.removeEventListener("mousedown", nativeDown, true);
  }, [resizableProp]);

  return (
    <TableCell
      padding="none"
      align="right"
      {...tableCellProps}
      sx={{
        position: "relative",
        width: w,
        minWidth: w,
        maxWidth: w,
        boxSizing: "border-box",
        verticalAlign: "center",
        overflow: "visible",
        zIndex: stackZIndex,
        isolation: "isolate",
        ...sxProps,
      }}
    >
      <Box
        sx={{
          pl: 2,
          pr: showRightSeparator ? `${rightGutter}px` : 2,
          py: 1.5,
          overflow: "hidden",
          maxWidth: "100%",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          textAlign: "right",
          direction: "rtl",
        }}
      >
        <Box
          component="div"
          sx={{
            display: "inline-block",
            maxWidth: "100%",
            minWidth: 0,
            pointerEvents: "auto",
            textAlign: "right",
            direction: "rtl",
            "& .MuiTableSortLabel-root": { maxWidth: "100%", minWidth: 0 },
          }}
        >
          {children}
        </Box>
      </Box>
      {showRightSeparator && (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            insetInlineEnd: 0,
            top: 0,
            bottom: 0,
            width: rightGutter,
            zIndex: 2,
            pointerEvents: "none",
            "&::before": {
              content: '""',
              position: "absolute",
              insetInlineEnd: LINE_INSET_FROM_RIGHT,
              top: 10,
              bottom: 10,
              width: 1,
              borderRadius: 0.5,
              backgroundColor: alpha(theme.palette.text.primary, 0.1),
            },
            ...(resizableProp && {
              "&:has(> *:hover)::before": {
                backgroundColor: alpha(theme.palette.primary.main, 0.65),
                top: 6,
                bottom: 6,
              },
            }),
          }}
        >
          {resizableProp && (
            <Box
              ref={handleRef}
              role="separator"
              aria-orientation="vertical"
              title="Resize"
              sx={{
                position: "absolute",
                insetInlineEnd: 0,
                top: 0,
                bottom: 0,
                width: RESIZE_HIT_PX,
                cursor: "col-resize",
                touchAction: "none",
                pointerEvents: "auto",
              }}
            />
          )}
        </Box>
      )}
    </TableCell>
  );
}

export function AlignedTableCell({
  width,
  children,
  dense = false,
  cellDir = "rtl",
  sx: sxProps,
  ...rest
}: TableCellProps & { width: number; dense?: boolean; cellDir?: "ltr" | "rtl" }) {
  const w = num(width, 100);
  return (
    <TableCell
      padding="none"
      align="right"
      {...rest}
      sx={{
        width: w,
        minWidth: w,
        maxWidth: w,
        boxSizing: "border-box",
        ...sxProps,
      }}
    >
      <Box
        sx={{
          pl: 2,
          pr: 2,
          py: dense ? 0.75 : 1.5,
          overflow: "hidden",
          textAlign: "right",
          direction: cellDir,
        }}
      >
        {children}
      </Box>
    </TableCell>
  );
}

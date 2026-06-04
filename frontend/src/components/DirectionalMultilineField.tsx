import { useCallback, useLayoutEffect, useRef } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { Box, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import type { TextFieldProps } from "@mui/material";
import FormatTextdirectionLToR from "@mui/icons-material/FormatTextdirectionLToR";
import FormatTextdirectionRToL from "@mui/icons-material/FormatTextdirectionRToL";
import type { TextDirection } from "../utils/textDirectionShortcut";
import { bidiInputSlotProps, useRegisterBidiFocus } from "../hooks/useBidiTextField";
import { he } from "../i18n/he";
import { applyMixedTextChange, tryInsertMixedNewline } from "../utils/bidiLineDirection";
import { bidiMixedEditSx } from "../styles/bidiMixedText";

export type DirectionalFieldVariant = "directional" | "mixed";

interface DirectionalMultilineFieldProps
  extends Pick<
    TextFieldProps,
    "label" | "placeholder" | "disabled" | "required" | "minRows" | "maxRows" | "size" | "sx"
  > {
  value: string;
  onChange: (value: string) => void;
  /** Par ligne (hébreu + code) — ignore direction / onDirectionChange. */
  variant?: DirectionalFieldVariant;
  direction?: TextDirection;
  onDirectionChange?: (dir: TextDirection) => void;
  /** Afficher la légende RTL/LTR ou mixte au-dessus du champ. */
  showHint?: boolean;
}

function DirectionToolbar({
  direction,
  onDirection,
  disabled,
}: {
  direction: TextDirection;
  onDirection: (dir: TextDirection) => void;
  disabled?: boolean;
}) {
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={direction}
      disabled={disabled}
      onChange={(_, v: TextDirection | null) => {
        if (v) onDirection(v);
      }}
      aria-label={he.textDirectionToolbar}
    >
      <ToggleButton
        value="rtl"
        aria-label={he.textDirectionRtl}
        title={`${he.textDirectionRtl} (${he.textDirectionShortcutRtl})`}
      >
        <FormatTextdirectionRToL fontSize="small" />
      </ToggleButton>
      <ToggleButton
        value="ltr"
        aria-label={he.textDirectionLtr}
        title={`${he.textDirectionLtr} (${he.textDirectionShortcutLtr})`}
      >
        <FormatTextdirectionLToR fontSize="small" />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

export default function DirectionalMultilineField({
  label,
  value,
  onChange,
  variant = "directional",
  direction = "rtl",
  onDirectionChange,
  disabled,
  required,
  placeholder,
  minRows = 3,
  maxRows = 8,
  size,
  sx,
  showHint = true,
}: DirectionalMultilineFieldProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pendingCursorRef = useRef<number | null>(null);
  const isMixed = variant === "mixed";

  useLayoutEffect(() => {
    const pos = pendingCursorRef.current;
    if (pos == null || !inputRef.current) return;
    inputRef.current.selectionStart = pos;
    inputRef.current.selectionEnd = pos;
    pendingCursorRef.current = null;
  }, [value]);

  const emitMixedChange = useCallback(
    (raw: string, cursor: number) => {
      const { text, cursor: nextCursor } = applyMixedTextChange(value, raw, cursor);
      onChange(text);
      if (nextCursor !== cursor) pendingCursorRef.current = nextCursor;
    },
    [value, onChange],
  );

  const handleMixedKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      const nextCursor = tryInsertMixedNewline(e, value, (next) => {
        const pos = e.currentTarget.selectionStart ?? 0;
        emitMixedChange(next, pos);
      });
      if (nextCursor != null) pendingCursorRef.current = nextCursor;
    },
    [value, emitMixedChange],
  );

  const handleMixedChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const el = e.target;
      emitMixedChange(el.value, el.selectionStart ?? el.value.length);
    },
    [emitMixedChange],
  );
  const onDirection = useCallback(
    (dir: TextDirection) => {
      if (!isMixed) onDirectionChange?.(dir);
    },
    [isMixed, onDirectionChange],
  );
  useRegisterBidiFocus(inputRef, onDirection);
  const slotProps = isMixed
    ? {
        htmlInput: { dir: "auto" as const, "data-bidi": "off", onKeyDown: handleMixedKeyDown },
        input: { onKeyDown: handleMixedKeyDown },
      }
    : bidiInputSlotProps(direction, onDirection);

  return (
    <Box sx={sx}>
      {showHint && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
            justifyContent: "space-between",
            mb: 0.5,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {isMixed ? he.textDirectionMixedHint : he.textDirectionHint}
          </Typography>
          {!isMixed && onDirectionChange && (
            <DirectionToolbar direction={direction} onDirection={onDirectionChange} disabled={disabled} />
          )}
        </Box>
      )}
      <TextField
        label={label}
        value={value}
        onChange={isMixed ? handleMixedChange : (e) => onChange(e.target.value)}
        inputRef={inputRef}
        fullWidth
        multiline
        size={size}
        minRows={minRows}
        maxRows={maxRows}
        dir={isMixed ? "auto" : direction}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        slotProps={slotProps}
        sx={
          isMixed
            ? { width: "100%", "& textarea": { ...bidiMixedEditSx, fontFamily: "inherit" } }
            : { width: "100%" }
        }
      />
    </Box>
  );
}

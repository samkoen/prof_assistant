import type { KeyboardEvent } from "react";
import { Box, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import type { TextFieldProps } from "@mui/material";
import FormatTextdirectionLToR from "@mui/icons-material/FormatTextdirectionLToR";
import FormatTextdirectionRToL from "@mui/icons-material/FormatTextdirectionRToL";
import {
  handleTextDirectionShortcut,
  type TextDirection,
} from "../utils/textDirectionShortcut";
import { he } from "../i18n/he";

interface DirectionalMultilineFieldProps
  extends Pick<TextFieldProps, "label" | "placeholder" | "disabled" | "required" | "minRows" | "maxRows"> {
  value: string;
  onChange: (value: string) => void;
  direction: TextDirection;
  onDirectionChange: (dir: TextDirection) => void;
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
  direction,
  onDirectionChange,
  disabled,
  required,
  placeholder,
  minRows = 3,
  maxRows = 8,
}: DirectionalMultilineFieldProps) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    handleTextDirectionShortcut(e, onDirectionChange);
  };

  return (
    <Box>
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
          {he.textDirectionHint}
        </Typography>
        <DirectionToolbar
          direction={direction}
          onDirection={onDirectionChange}
          disabled={disabled}
        />
      </Box>
      <TextField
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        fullWidth
        multiline
        minRows={minRows}
        maxRows={maxRows}
        dir={direction}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        slotProps={{
          htmlInput: { dir: direction },
        }}
      />
    </Box>
  );
}

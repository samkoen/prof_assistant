import { Box, IconButton, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import { he } from "../../../i18n/he";
import type { GeminiSource } from "../../../types/geminiSource";
import { rolesFromSource, type SourceRole } from "../../../utils/geminiSourceRole";

type SourceFileRowProps = {
  source: GeminiSource;
  disabled?: boolean;
  onRolesChange: (source: GeminiSource, roles: SourceRole[]) => void;
  onDelete: (source: GeminiSource) => void;
};

/** Un fichier joint : nom, taille, rôle (contenu / style) et suppression. */
export default function SourceFileRow({ source, disabled, onRolesChange, onDelete }: SourceFileRowProps) {
  return (
    <Box
      dir="rtl"
      sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", px: 1.5, py: 1, border: "1px solid", borderColor: "divider", borderRadius: 2 }}
    >
      <DescriptionOutlinedIcon color="primary" />
      <Box sx={{ flex: 1, minWidth: 140 }}>
        <Typography variant="body2" fontWeight={600} noWrap dir="auto">
          {source.original_filename}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {source.char_count.toLocaleString("he-IL")} {he.geminiSourceChars}
        </Typography>
      </Box>
      <ToggleButtonGroup
        size="small"
        color="primary"
        value={rolesFromSource(source)}
        disabled={disabled}
        aria-label={he.geminiSourceRoleLabel}
        onChange={(_, roles: SourceRole[]) => onRolesChange(source, roles)}
      >
        <Tooltip title={he.geminiSourceUseContent}>
          <ToggleButton value="content">{he.geminiSourceRoleContent}</ToggleButton>
        </Tooltip>
        <Tooltip title={he.geminiSourceUseStyle}>
          <ToggleButton value="style">{he.geminiSourceRoleStyle}</ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>
      <Tooltip title={he.geminiSourceDelete}>
        <span>
          <IconButton size="small" color="error" disabled={disabled} aria-label={he.geminiSourceDelete} onClick={() => onDelete(source)}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}

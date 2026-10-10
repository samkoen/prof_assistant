import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import SourceRoleChips from "./SourceRoleChips";
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
      <SourceRoleChips
        roles={rolesFromSource(source)}
        disabled={disabled}
        onChange={(roles) => onRolesChange(source, roles)}
      />
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

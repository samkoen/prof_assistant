import { Box, IconButton, Tooltip } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import type { CatalogCourse } from "../../api/client";
import { he } from "../../i18n/he";

type CatalogHeaderActionsProps = {
  catalog: CatalogCourse;
  onEdit: (catalog: CatalogCourse) => void;
  onDelete: (catalog: CatalogCourse) => void;
};

/** Icônes d'en-tête d'une carte catalogue : édition puis suppression. */
export function CatalogHeaderActions({ catalog, onEdit, onDelete }: CatalogHeaderActionsProps) {
  return (
    <Box sx={{ display: "flex", gap: 0.25, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
      <Tooltip title={he.editCatalogCourse}>
        <IconButton size="small" aria-label={he.editCatalogCourse} sx={{ color: "text.secondary" }} onClick={() => onEdit(catalog)}>
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={he.deleteCatalogCourse}>
        <IconButton size="small" color="error" aria-label={he.deleteCatalogCourse} onClick={() => onDelete(catalog)}>
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

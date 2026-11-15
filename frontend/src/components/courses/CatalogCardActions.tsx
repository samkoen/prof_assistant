import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ActionsMenu from "../ui/ActionsMenu";
import type { CatalogCourse } from "../../api/client";
import { he } from "../../i18n/he";

type CatalogHeaderActionsProps = {
  catalog: CatalogCourse;
  onEdit: (catalog: CatalogCourse) => void;
  onDelete: (catalog: CatalogCourse) => void;
};

/** Menu « ⋮ » d'une carte מקצוע : édition puis suppression. */
export function CatalogHeaderActions({ catalog, onEdit, onDelete }: CatalogHeaderActionsProps) {
  return (
    <ActionsMenu
      label={he.actions}
      actions={[
        { key: "edit", label: he.editCatalogCourse, icon: <EditOutlinedIcon fontSize="small" />, onClick: () => onEdit(catalog) },
        { key: "delete", label: he.deleteCatalogCourse, icon: <DeleteOutlineIcon fontSize="small" />, danger: true, onClick: () => onDelete(catalog) },
      ]}
    />
  );
}

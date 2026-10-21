import { Tooltip } from "@mui/material";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { he } from "../../i18n/he";

/** Pastille œil : une seule raison affichée pour « invisible » (masquée, brouillon ou pas envoyée). */
export default function StudentVisibilityIcon({ visible }: { visible: boolean }) {
  const label = visible ? he.visibleToStudents : he.notVisibleToStudents;
  return (
    <Tooltip title={label}>
      {visible ? (
        <VisibilityOutlinedIcon fontSize="small" color="success" aria-label={label} sx={{ flexShrink: 0 }} />
      ) : (
        <VisibilityOffOutlinedIcon fontSize="small" color="disabled" aria-label={label} sx={{ flexShrink: 0 }} />
      )}
    </Tooltip>
  );
}

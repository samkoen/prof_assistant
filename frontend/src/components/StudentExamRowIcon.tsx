import { Box } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

type StudentExamRowIconProps = {
  submitted: boolean;
  canAccess: boolean;
};

/** Indicateur visuel (non cliquable) — le clic est sur toute la ligne. */
export default function StudentExamRowIcon({ submitted, canAccess }: StudentExamRowIconProps) {
  return (
    <Box
      aria-hidden
      sx={{
        display: "flex",
        alignItems: "center",
        color: submitted ? "primary.main" : "success.main",
        opacity: canAccess ? 1 : 0.45,
      }}
    >
      {submitted ? <VisibilityOutlinedIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
    </Box>
  );
}

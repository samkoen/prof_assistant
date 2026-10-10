import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import type { ExamTake } from "../../../api/client";
import { he } from "../../../i18n/he";
import { studentCourseExamsPath } from "../../../utils/studentCourseExamsNav";
import StatusChip from "../../ui/StatusChip";

type ExamTakeHeaderProps = { paper: ExamTake; sessionId: number; showTitle: boolean };

/** Lien de retour + titre de l'examen (le titre passe dans la barre collante pendant la passation). */
export default function ExamTakeHeader({ paper, sessionId, showTitle }: ExamTakeHeaderProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <Button component={RouterLink} to={studentCourseExamsPath(paper.offering_id, sessionId)} startIcon={<ArrowBackIcon />} size="small">
        {he.backToCourseExams}
      </Button>
      {showTitle && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1.5, flexWrap: "wrap" }}>
          <Typography variant="h5" fontWeight={800}>{paper.exam_title}</Typography>
          {paper.is_tirgoul && <StatusChip label={he.tirgoulChip} tone="info" />}
        </Box>
      )}
      {paper.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{paper.description}</Typography>
      )}
    </Box>
  );
}

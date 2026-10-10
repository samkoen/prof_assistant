import { Link } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import type { ExamSession } from "../../api/client";
import HebrewCardRow from "../ui/HebrewCardRow";
import StatusChip from "../ui/StatusChip";
import { he } from "../../i18n/he";
import { sessionStatusView, sessionTargetPath } from "../../utils/examStatus";

/** Examen clos dont les notes attendent d'être publiées : un clic pour s'en occuper. */
export default function AwaitingPublishRow({ session }: { session: ExamSession }) {
  const status = sessionStatusView(session);
  return (
    <HebrewCardRow
      text={
        <Box>
          <Box sx={{ mb: 0.75 }}>
            <StatusChip label={status.label} tone={status.tone} />
          </Box>
          <Typography fontWeight={700}>{session.exam_title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {session.catalog_name} · {session.group_name}
          </Typography>
        </Box>
      }
      actions={
        <Button component={Link} to={sessionTargetPath(session)} size="small" variant="contained">
          {he.viewExamGrades}
        </Button>
      }
    />
  );
}

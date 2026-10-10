import { Link } from "react-router-dom";
import { Box, ButtonBase, Skeleton, Typography } from "@mui/material";
import QuizIcon from "@mui/icons-material/Quiz";
import type { ExamSession } from "../../api/client";
import EmptyState from "../ui/EmptyState";
import SectionHeader from "../ui/SectionHeader";
import StatusChip from "../ui/StatusChip";
import { he } from "../../i18n/he";
import { brand } from "../../theme/brand";
import { sessionStatusView, sessionTargetPath } from "../../utils/examStatus";
import { recentSessions } from "../../utils/teacherDashboard";

type RecentExamsPanelProps = {
  sessions: ExamSession[];
  loading: boolean;
};

const rowSx = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 1.5,
  px: 2,
  py: 1.5,
  textAlign: "right",
  borderRadius: 2.5,
  border: `1px solid ${brand.slate200}`,
  transition: "border-color 0.15s ease, background-color 0.15s ease",
  "&:hover": { borderColor: brand.violet400, bgcolor: brand.violet50 },
} as const;

function RecentRow({ session }: { session: ExamSession }) {
  const status = sessionStatusView(session);
  return (
    <ButtonBase component={Link} to={sessionTargetPath(session)} sx={rowSx}>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography fontWeight={700} noWrap>
          {session.exam_title}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {session.catalog_name} · {session.group_name}
        </Typography>
      </Box>
      <StatusChip label={status.label} tone={status.tone} />
    </ButtonBase>
  );
}

/** Les derniers examens activés / clos, avec leur état en un coup d'œil. */
export default function RecentExamsPanel({ sessions, loading }: RecentExamsPanelProps) {
  const rows = recentSessions(sessions, 5);
  return (
    <Box>
      <SectionHeader title={he.recentExamsTitle} linkLabel={he.recentExamsAll} linkTo="/teacher/exams" />
      {loading ? (
        <Skeleton variant="rounded" height={180} />
      ) : rows.length === 0 ? (
        <EmptyState title={he.recentExamsEmpty} description={he.recentExamsEmptyHint} icon={<QuizIcon />} />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {rows.map((s) => (
            <RecentRow key={s.id} session={s} />
          ))}
        </Box>
      )}
    </Box>
  );
}

import { Box, Skeleton } from "@mui/material";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import type { ReviewAction } from "../PendingEnrollmentActions";
import EmptyState from "../ui/EmptyState";
import SectionHeader from "../ui/SectionHeader";
import AwaitingPublishRow from "./AwaitingPublishRow";
import PendingRequestCard from "./PendingRequestCard";
import type { Enrollment, ExamSession } from "../../api/client";
import { he } from "../../i18n/he";
import { sessionStatusView } from "../../utils/examStatus";

type TeacherTodoPanelProps = {
  pending: Enrollment[];
  sessions: ExamSession[];
  loading: boolean;
  reviewing: ReviewAction | null;
  onReview: (id: number, status: "approved" | "rejected") => void;
};

const MAX_PENDING_SHOWN = 4;

function TodoSkeleton() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Skeleton variant="rounded" height={84} />
      <Skeleton variant="rounded" height={84} />
    </Box>
  );
}

/** « À traiter maintenant » : demandes d'inscription + notes à publier. */
export default function TeacherTodoPanel({ pending, sessions, loading, reviewing, onReview }: TeacherTodoPanelProps) {
  const awaiting = sessions.filter((s) => sessionStatusView(s).key === "awaiting_publish");
  const empty = pending.length === 0 && awaiting.length === 0;
  return (
    <Box>
      <SectionHeader title={he.todoTitle} linkLabel={he.pendingApprovals} linkTo="/teacher/enrollments" />
      {loading ? (
        <TodoSkeleton />
      ) : empty ? (
        <EmptyState title={he.todoEmptyTitle} description={he.todoEmptyDesc} icon={<HowToRegOutlinedIcon />} />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {pending.slice(0, MAX_PENDING_SHOWN).map((row) => (
            <PendingRequestCard key={`p-${row.id}`} enrollment={row} reviewing={reviewing} onReview={onReview} />
          ))}
          {awaiting.map((s) => (
            <AwaitingPublishRow key={`s-${s.id}`} session={s} />
          ))}
        </Box>
      )}
    </Box>
  );
}

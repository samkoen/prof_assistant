import { Skeleton } from "@mui/material";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import StudentExamList from "./StudentExamList";
import EmptyState from "../ui/EmptyState";
import SectionHeader from "../ui/SectionHeader";
import type { StudentExamSessionWithAttempt } from "../../api/client";
import { he } from "../../i18n/he";

const MAX_ROWS = 3;

type StudentUpNextPanelProps = {
  pending: StudentExamSessionWithAttempt[];
  loading: boolean;
  onOpen: (sessionId: number) => void;
};

/** « מה עכשיו ? » : les examens à reprendre ou démarrer, les plus urgents d'abord. */
export default function StudentUpNextPanel({ pending, loading, onOpen }: StudentUpNextPanelProps) {
  return (
    <>
      <SectionHeader title={he.studentUpNextTitle} linkLabel={he.recentExamsAll} linkTo="/student/exams" />
      {loading ? (
        <Skeleton variant="rounded" height={160} />
      ) : (
        <StudentExamList
          sessions={pending.slice(0, MAX_ROWS)}
          showCourse
          onOpen={onOpen}
          empty={<EmptyState title={he.studentUpNextEmpty} description={he.studentUpNextEmptyHint} icon={<EventAvailableIcon />} />}
        />
      )}
    </>
  );
}

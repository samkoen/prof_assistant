import type { ReactNode } from "react";
import { Stack } from "@mui/material";
import StudentExamCard from "./StudentExamCard";
import type { StudentExamSessionWithAttempt } from "../../api/client";

type StudentExamListProps = {
  sessions: StudentExamSessionWithAttempt[];
  showCourse?: boolean;
  highlightedId?: number | null;
  /** Affiché quand la liste est vide. */
  empty: ReactNode;
  onOpen: (sessionId: number) => void;
  extraFor?: (session: StudentExamSessionWithAttempt) => ReactNode;
};

/** Pile de cartes d'examens ; affiche `empty` s'il n'y en a aucune. */
export default function StudentExamList({ sessions, showCourse, highlightedId = null, empty, onOpen, extraFor }: StudentExamListProps) {
  if (sessions.length === 0) return <>{empty}</>;
  return (
    <Stack spacing={1.5}>
      {sessions.map((s) => (
        <StudentExamCard
          key={s.id}
          session={s}
          showCourse={showCourse}
          highlighted={highlightedId === s.id}
          onOpen={onOpen}
          extra={extraFor?.(s)}
        />
      ))}
    </Stack>
  );
}

import { useCallback, useState } from "react";
import { api, ApiError, type StudentCoursesBoard } from "../api/client";
import { he } from "../i18n/he";
import { usePolledLoader } from "./usePolledLoader";

const REFRESH_MS = 15000;
const EMPTY_BOARD: StudentCoursesBoard = { offerings: [], pending_offerings: [], active_exam_counts: {} };

/** Cours de l'élève (approuvés + en attente d'approbation) et nombre d'examens actifs par cours. */
export function useStudentCourses() {
  const [board, setBoard] = useState<StudentCoursesBoard>(EMPTY_BOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setBoard(await api<StudentCoursesBoard>("/api/courses/student-board"));
      setError("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, []);

  // Tant qu'une demande attend l'approbation du prof, on surveille le changement d'état.
  usePolledLoader(load, REFRESH_MS, board.pending_offerings.length > 0);

  return { ...board, loading, error, setError, reload: load };
}

import { useEffect, useState } from "react";
import {
  fetchMoodleAssignments,
  moodleError,
  pushMoodleGrades,
  selectMoodleAssignment,
  type MoodleAssignmentsView,
  type MoodleGradeSkip,
} from "../api/moodle";
import { he } from "../i18n/he";

export function useMoodleGrades(sessionId: number, onSuccess: (message: string) => void) {
  const [view, setView] = useState<MoodleAssignmentsView | null>(null);
  const [assignId, setAssignId] = useState<number | "">("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [skipped, setSkipped] = useState<MoodleGradeSkip[]>([]);

  useEffect(() => {
    let active = true;
    fetchMoodleAssignments(sessionId)
      .then((data) => {
        if (!active) return;
        setView(data);
        setAssignId(data.selected_assign_id ?? "");
      })
      .catch((err) => {
        if (active) setError(moodleError(err));
      });
    return () => {
      active = false;
    };
  }, [sessionId]);

  function push() {
    return sendSessionGrades(sessionId, assignId, { setBusy, setError, setSkipped, onSuccess });
  }

  return { view, assignId, setAssignId, error, busy, skipped, push };
}

async function sendSessionGrades(
  sessionId: number,
  assignId: number | "",
  bag: {
    setBusy: (value: boolean) => void;
    setError: (value: string) => void;
    setSkipped: (value: MoodleGradeSkip[]) => void;
    onSuccess: (message: string) => void;
  },
) {
  if (assignId === "") return;
  bag.setBusy(true);
  bag.setError("");
  try {
    await selectMoodleAssignment(sessionId, assignId);
    const result = await pushMoodleGrades(sessionId);
    bag.setSkipped(result.skipped);
    bag.onSuccess(he.moodleGradesSent(result.sent));
  } catch (err) {
    bag.setError(moodleError(err));
  } finally {
    bag.setBusy(false);
  }
}

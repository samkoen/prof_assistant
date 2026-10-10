import { useState } from "react";
import { api } from "../api/client";
import { useFeedback } from "../context/FeedbackContext";
import { he } from "../i18n/he";

async function approveOne(id: number): Promise<number | null> {
  try {
    await api(`/api/enrollments/${id}`, { method: "PATCH", body: JSON.stringify({ status: "approved" }) });
    return id;
  } catch {
    return null;
  }
}

/** Approuve plusieurs demandes d'un coup ; les échecs n'empêchent pas les autres. */
export function useBulkApproval(onApproved: (ids: number[]) => void) {
  const { showSuccess, showError } = useFeedback();
  const [busy, setBusy] = useState(false);

  const approveAll = async (ids: number[]) => {
    setBusy(true);
    const done = (await Promise.all(ids.map(approveOne))).filter((id): id is number => id !== null);
    onApproved(done);
    const failed = ids.length - done.length;
    if (failed === 0) showSuccess(he.enrollmentsApprovedMany(done.length));
    else showError(he.enrollmentsApprovedPartial(done.length, failed));
    setBusy(false);
  };

  return { busy, approveAll };
}

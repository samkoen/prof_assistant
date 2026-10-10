import { useState } from "react";
import { api, ApiError, type ExamSession } from "../api/client";
import { SESSION_ACTION_COPY, type SessionActionKind } from "../components/exams/sessionActionCopy";
import { he } from "../i18n/he";

export type PendingSessionAction = { kind: SessionActionKind; session: ExamSession };
export type SessionBusy = { kind: SessionActionKind; id: number } | null;

type Options = {
  reload: () => Promise<void>;
  onError: (message: string) => void;
  onReopened: () => void;
};

/** Clôturer / annuler la mise en ligne / rouvrir : confirmation puis appel API. */
export function useSessionLifecycle({ reload, onError, onReopened }: Options) {
  const [pending, setPending] = useState<PendingSessionAction | null>(null);
  const [busy, setBusy] = useState<SessionBusy>(null);

  const request = (kind: SessionActionKind, session: ExamSession) => setPending({ kind, session });
  const cancel = () => setPending(null);

  const confirm = async () => {
    if (!pending) return;
    const { kind, session } = pending;
    setBusy({ kind, id: session.id });
    try {
      await api(`/api/exams/sessions/${session.id}/${SESSION_ACTION_COPY[kind].endpoint}`, { method: "POST" });
      setPending(null);
      if (kind === "reopen") onReopened();
      await reload();
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setBusy(null);
    }
  };

  return { pending, busy, request, cancel, confirm };
}

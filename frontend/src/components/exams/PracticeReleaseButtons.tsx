import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar, Typography } from "@mui/material";
import { api, ApiError } from "../../api/client";
import { he } from "../../i18n/he";
import { practiceReleaseActions, type PracticeReleaseInput } from "../../utils/practiceRelease";
import { ButtonTriggers, IconTriggers, type ReleaseKind } from "./PracticeReleaseTriggers";

type PracticeReleaseButtonsProps = PracticeReleaseInput & {
  examId: number;
  sessionId?: number;
  offeringId?: number;
  onChanged: () => void | Promise<void>;
  onError: (message: string) => void;
  onSuccess?: (message: string) => void;
  /** Icônes avec tooltip au lieu de boutons texte. */
  iconOnly?: boolean;
};

type Copy = { title: string; message: string; done: string; color: "success" | "warning" };

const COPY: Record<ReleaseKind, Copy> = {
  deploy: { title: he.deployToStudents, message: he.deployToStudentsConfirm, done: he.deployedToStudents, color: "success" },
  block: { title: he.blockGrading, message: he.blockGradingConfirm, done: he.gradingBlocked, color: "warning" },
  unlock: { title: he.unlockGrading, message: he.unlockGradingConfirm, done: he.gradingUnblocked, color: "success" },
};

/** Le blocage et son déblocage s'annulent l'un l'autre ; l'envoi notifie les élèves et reste définitif. */
const INVERSE: Partial<Record<ReleaseKind, ReleaseKind>> = { block: "unlock", unlock: "block" };

async function postRelease(kind: ReleaseKind, props: PracticeReleaseButtonsProps): Promise<void> {
  if (kind === "block" && props.sessionId) {
    await api(`/api/exams/sessions/${props.sessionId}/block-grading`, { method: "POST" });
    return;
  }
  if (props.sessionId) {
    await api(`/api/exams/sessions/${props.sessionId}/deploy`, { method: "POST" });
    return;
  }
  await api(`/api/exams/${props.examId}/deploy`, {
    method: "POST",
    body: JSON.stringify({ offering_id: props.offeringId }),
  });
}

type Undo = { kind: ReleaseKind; message: string };

function useRelease(props: PracticeReleaseButtonsProps) {
  const [pending, setPending] = useState<ReleaseKind | null>(null);
  const [loading, setLoading] = useState(false);
  const [undo, setUndo] = useState<Undo | null>(null);

  const run = async (kind: ReleaseKind, offerUndo: boolean) => {
    setLoading(true);
    try {
      await postRelease(kind, props);
      const inverse = INVERSE[kind];
      if (offerUndo && inverse) setUndo({ kind: inverse, message: COPY[kind].done });
      else props.onSuccess?.(COPY[kind].done);
      setPending(null);
      await props.onChanged();
    } catch (e) {
      props.onError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const confirm = () => (pending ? run(pending, true) : Promise.resolve());
  const undoLast = async () => {
    const last = undo;
    setUndo(null);
    if (last) await run(last.kind, false);
  };
  return { pending, setPending, loading, undo, dismissUndo: () => setUndo(null), confirm, undoLast };
}

function ReleaseDialog({
  kind,
  loading,
  onClose,
  onConfirm,
}: {
  kind: ReleaseKind | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const copy = kind ? COPY[kind] : null;
  return (
    <Dialog open={Boolean(copy)} onClose={onClose} fullWidth maxWidth="xs" dir="rtl">
      <DialogTitle>{copy?.title}</DialogTitle>
      <DialogContent>
        <Typography>{copy?.message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{he.cancel}</Button>
        <Button variant="contained" color={copy?.color} onClick={onConfirm} disabled={loading}>
          {loading ? he.loading : copy?.title}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function UndoSnackbar({ undo, onUndo, onClose }: { undo: Undo | null; onUndo: () => void; onClose: () => void }) {
  return (
    <Snackbar
      open={undo !== null}
      autoHideDuration={8000}
      onClose={(_, reason) => reason !== "clickaway" && onClose()}
      message={undo?.message}
      action={
        <Button color="inherit" size="small" onClick={onUndo}>
          {he.undoAction}
        </Button>
      }
    />
  );
}

/** Envoi aux élèves, blocage ou déblocage de la note, pour un תרגול ou une משימה. */
export default function PracticeReleaseButtons(props: PracticeReleaseButtonsProps) {
  const actions = practiceReleaseActions(props);
  const release = useRelease(props);
  const visible = actions.deploy || actions.deployBlocked || actions.block || actions.unlock;
  const Triggers = props.iconOnly ? IconTriggers : ButtonTriggers;

  return (
    <>
      {visible && <Triggers actions={actions} loading={release.loading} onPick={release.setPending} />}
      <ReleaseDialog
        kind={release.pending}
        loading={release.loading}
        onClose={() => release.setPending(null)}
        onConfirm={() => void release.confirm()}
      />
      <UndoSnackbar undo={release.undo} onUndo={() => void release.undoLast()} onClose={release.dismissUndo} />
    </>
  );
}

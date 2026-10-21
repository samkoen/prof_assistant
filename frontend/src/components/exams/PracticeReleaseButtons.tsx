import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Tooltip, Typography } from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import SendIcon from "@mui/icons-material/Send";
import { api, ApiError } from "../../api/client";
import { he } from "../../i18n/he";
import { practiceReleaseActions, type PracticeReleaseInput } from "../../utils/practiceRelease";
import LoadingButton from "../ui/LoadingButton";

type ReleaseKind = "deploy" | "block";

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

const COPY: Record<ReleaseKind, { title: string; message: string; done: string; color: "success" | "warning" }> = {
  deploy: { title: he.deployToStudents, message: he.deployToStudentsConfirm, done: he.deployedToStudents, color: "success" },
  block: { title: he.blockGrading, message: he.blockGradingConfirm, done: he.gradingBlocked, color: "warning" },
};

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

function ReleaseDialog({
  kind,
  title,
  loading,
  onClose,
  onConfirm,
}: {
  kind: ReleaseKind | null;
  title?: string;
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
        {title && <Typography fontWeight={700} sx={{ mt: 1.5 }}>{title}</Typography>}
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

/** Envoi aux élèves, ou blocage de la note, pour un תרגול ou une משימה. */
export default function PracticeReleaseButtons(props: PracticeReleaseButtonsProps) {
  const actions = practiceReleaseActions(props);
  const [pending, setPending] = useState<ReleaseKind | null>(null);
  const [loading, setLoading] = useState(false);
  if (!actions.deploy && !actions.deployBlocked && !actions.block) return null;

  const confirm = async () => {
    if (!pending) return;
    setLoading(true);
    try {
      await postRelease(pending, props);
      props.onSuccess?.(COPY[pending].done);
      setPending(null);
      await props.onChanged();
    } catch (e) {
      props.onError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const Triggers = props.iconOnly ? IconTriggers : ButtonTriggers;
  return (
    <>
      <Triggers actions={actions} loading={loading} onPick={setPending} />
      <ReleaseDialog kind={pending} loading={loading} onClose={() => setPending(null)} onConfirm={() => void confirm()} />
    </>
  );
}

type TriggersProps = {
  actions: ReturnType<typeof practiceReleaseActions>;
  loading: boolean;
  onPick: (kind: ReleaseKind) => void;
};

/** Variante icône + tooltip (tableaux denses). */
function IconTriggers({ actions, loading, onPick }: TriggersProps) {
  return (
    <>
      {actions.deploy && (
        <Tooltip title={he.deployToStudents}>
          <span>
            <IconButton size="small" color="success" aria-label={he.deployToStudents} disabled={loading} onClick={() => onPick("deploy")}>
              <SendIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
      {actions.deployBlocked && (
        <Tooltip title={he.deployNeedsContent}>
          <span>
            <IconButton size="small" aria-label={he.deployToStudents} disabled>
              <SendIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
      {actions.block && (
        <Tooltip title={he.blockGrading}>
          <span>
            <IconButton size="small" color="warning" aria-label={he.blockGrading} disabled={loading} onClick={() => onPick("block")}>
              <BlockIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </>
  );
}

function ButtonTriggers({ actions, loading, onPick }: TriggersProps) {
  return (
    <>
      {actions.deploy && (
        <LoadingButton size="small" variant="contained" color="success" startIcon={<SendIcon />} loading={loading} onClick={() => onPick("deploy")}>
          {he.deployToStudents}
        </LoadingButton>
      )}
      {actions.deployBlocked && (
        <Tooltip title={he.deployNeedsContent}>
          <span>
            <Button size="small" variant="contained" disabled startIcon={<SendIcon />}>{he.deployToStudents}</Button>
          </span>
        </Tooltip>
      )}
      {actions.block && (
        <LoadingButton size="small" variant="outlined" color="warning" startIcon={<BlockIcon />} loading={loading} onClick={() => onPick("block")}>
          {he.blockGrading}
        </LoadingButton>
      )}
    </>
  );
}

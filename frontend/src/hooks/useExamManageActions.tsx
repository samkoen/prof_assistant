import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadIcon from "@mui/icons-material/Download";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import ExamPortableExportDialog from "../components/ExamPortableExportDialog";
import ShareWithTeacherDialog from "../components/ShareWithTeacherDialog";
import { useHideExam } from "../components/exams/HideExamButton";
import type { MenuAction } from "../components/ui/ActionsMenu";
import { api, ApiError, downloadExamPdf, type Exam } from "../api/client";
import { he } from "../i18n/he";
import { isDevEnvironment } from "../utils/isDevEnvironment";

type Busy = "duplicate" | "delete" | "pdf" | null;

type Options = {
  onChanged: () => void;
  onError: (message: string) => void;
  onDeleted?: () => void;
  /** Depuis un קורס : retire la מטלה de ce קורס seulement. */
  offeringId?: number;
};

function errorText(e: unknown): string {
  return e instanceof ApiError ? e.message : he.errorGeneric;
}

function DeleteDialog({ open, exam, fromGroup, busy, onClose, onConfirm }: {
  open: boolean;
  exam: Exam;
  fromGroup: boolean;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const title = fromGroup ? he.removeExamFromGroup : he.deleteExam;
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" dir="rtl">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{fromGroup ? he.removeExamFromGroupConfirm : he.deleteExamConfirm}</Typography>
        <Typography fontWeight={600} sx={{ mt: 1 }}>{exam.title}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{he.cancel}</Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={busy}>
          {busy ? he.loading : title}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function useExamRequests(exam: Exam, opts: Options) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState<Busy>(null);
  const run = async (kind: Exclude<Busy, null>, task: () => Promise<void>) => {
    setBusy(kind);
    try {
      await task();
    } catch (e) {
      opts.onError(errorText(e));
    } finally {
      setBusy(null);
    }
  };
  const duplicate = () =>
    run("duplicate", async () => {
      const copy = await api<Exam>(`/api/exams/${exam.id}/duplicate`, { method: "POST", body: JSON.stringify({}) });
      navigate(`/teacher/exams/${copy.id}/edit?return=${encodeURIComponent(window.location.pathname)}`);
    });
  const pdf = () => run("pdf", () => downloadExamPdf(exam.id, exam.title));
  const remove = (after: () => void) =>
    run("delete", async () => {
      const path = opts.offeringId != null ? `/api/exams/${exam.id}/offerings/${opts.offeringId}` : `/api/exams/${exam.id}`;
      await api(path, { method: "DELETE" });
      after();
      if (opts.onDeleted) opts.onDeleted();
      else opts.onChanged();
    });
  return { busy, duplicate, pdf, remove };
}

/**
 * Actions de gestion d'une מטלה (dupliquer, partager, PDF, masquer, supprimer) :
 * renvoie des entrées de menu + les dialogues associés, à placer hors du menu.
 */
export function useExamManageActions(exam: Exam, opts: Options): { actions: MenuAction[]; dialogs: ReactNode } {
  const req = useExamRequests(exam, opts);
  const hide = useHideExam(exam, opts.onChanged, opts.onError);
  const [shareOpen, setShareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fromGroup = opts.offeringId != null;
  const canDelete = fromGroup || exam.can_delete !== false;
  const busy = req.busy !== null;

  const actions: MenuAction[] = [
    { key: "duplicate", label: req.busy === "duplicate" ? he.loading : he.duplicateExam, icon: <ContentCopyIcon fontSize="small" />, disabled: busy, onClick: () => void req.duplicate() },
    { key: "share", label: he.shareExam, icon: <ShareOutlinedIcon fontSize="small" />, onClick: () => setShareOpen(true) },
    ...(exam.question_count > 0
      ? [{ key: "pdf", label: req.busy === "pdf" ? he.loading : he.downloadExamPdf, icon: <DownloadIcon fontSize="small" />, disabled: busy, onClick: () => void req.pdf() }]
      : []),
    { key: "hide", label: hide.label, icon: hide.icon, onClick: hide.openDialog },
    ...(isDevEnvironment ? [{ key: "export", label: he.portableExportExam, icon: <FileUploadIcon fontSize="small" />, onClick: () => setExportOpen(true) }] : []),
    ...(canDelete
      ? [{ key: "delete", label: fromGroup ? he.removeExamFromGroup : he.deleteExam, icon: <DeleteOutlineIcon fontSize="small" />, danger: true, disabled: busy, onClick: () => setConfirmDelete(true) }]
      : []),
  ];

  const dialogs = (
    <>
      {hide.dialog}
      <ShareWithTeacherDialog open={shareOpen} kind="exam" examId={exam.id} itemLabel={exam.title} onClose={() => setShareOpen(false)} onSent={opts.onChanged} />
      {isDevEnvironment && <ExamPortableExportDialog open={exportOpen} examId={exam.id} examTitle={exam.title} onClose={() => setExportOpen(false)} />}
      <DeleteDialog open={confirmDelete} exam={exam} fromGroup={fromGroup} busy={req.busy === "delete"} onClose={() => setConfirmDelete(false)} onConfirm={() => void req.remove(() => setConfirmDelete(false))} />
    </>
  );
  return { actions, dialogs };
}

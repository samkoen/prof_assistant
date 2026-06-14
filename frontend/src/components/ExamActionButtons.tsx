import { useState, type ReactNode } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import ShareIcon from "@mui/icons-material/Share";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DownloadIcon from "@mui/icons-material/Download";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DisabledActionTooltip from "./DisabledActionTooltip";
import ExamPdfDownloadButton from "./ExamPdfDownloadButton";
import ExamPortableExportDialog from "./ExamPortableExportDialog";
import ShareWithTeacherDialog from "./ShareWithTeacherDialog";
import { api, ApiError, downloadExamPdf, type Exam } from "../api/client";
import { he } from "../i18n/he";

export type ExamRowPrimaryAction = "delete" | "duplicate";

export type ExamRowMenuExtra = {
  key: string;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  onClick: () => void;
};

interface ExamActionButtonsProps {
  exam: Exam;
  onChanged: () => void;
  onError: (message: string) => void;
  size?: "small" | "medium";
  iconOnly?: boolean;
  /** Masquer les actions indisponibles (ex. supprimer si examen activé). */
  hideInactive?: boolean;
  /** Tableau cours : 3e action inline + menu ⋮ en dernier. */
  courseRowLayout?: boolean;
  primaryAction?: ExamRowPrimaryAction;
  menuExtras?: ExamRowMenuExtra[];
}

export function ExamActionButtons({
  exam,
  onChanged,
  onError,
  size = "small",
  iconOnly = false,
  hideInactive = false,
  courseRowLayout = false,
  primaryAction = "delete",
  menuExtras = [],
}: ExamActionButtonsProps) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [busy, setBusy] = useState<"duplicate" | "delete" | "pdf" | null>(null);
  const canDelete = exam.can_delete !== false;

  const closeMenu = () => setMenuAnchor(null);

  const downloadPdf = async () => {
    if (exam.question_count <= 0) return;
    closeMenu();
    setBusy("pdf");
    try {
      await downloadExamPdf(exam.id, exam.title);
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setBusy(null);
    }
  };

  const duplicate = async () => {
    setBusy("duplicate");
    try {
      const copy = await api<Exam>(`/api/exams/${exam.id}/duplicate`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      navigate(`/teacher/exams/${copy.id}/edit?return=${encodeURIComponent(window.location.pathname)}`);
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy("delete");
    try {
      await api(`/api/exams/${exam.id}`, { method: "DELETE" });
      setConfirmDelete(false);
      onChanged();
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setBusy(null);
    }
  };

  const deleteBtn = iconOnly ? (
    <DisabledActionTooltip
      disabled={busy != null || !canDelete}
      disabledReason={!canDelete ? he.cannotDeleteExamActivated : undefined}
      title={busy === "delete" ? he.loading : he.deleteExam}
    >
      <IconButton
        size="small"
        color="error"
        aria-label={he.deleteExam}
        onClick={() => setConfirmDelete(true)}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </DisabledActionTooltip>
  ) : (
    <DisabledActionTooltip
      disabled={busy != null || !canDelete}
      disabledReason={!canDelete ? he.cannotDeleteExamActivated : undefined}
      title={busy === "delete" ? he.loading : he.deleteExam}
    >
      <Button
        size={size}
        variant="outlined"
        color="error"
        startIcon={<DeleteIcon />}
        onClick={() => setConfirmDelete(true)}
      >
        {he.deleteExam}
      </Button>
    </DisabledActionTooltip>
  );

  const duplicateBtn = iconOnly ? (
    <Tooltip title={busy === "duplicate" ? he.loading : he.duplicateExam}>
      <span>
        <IconButton
          size="small"
          aria-label={he.duplicateExam}
          disabled={busy != null}
          onClick={duplicate}
        >
          {busy === "duplicate" ? (
            <CircularProgress size={18} />
          ) : (
            <ContentCopyIcon fontSize="small" />
          )}
        </IconButton>
      </span>
    </Tooltip>
  ) : (
    <Button
      size={size}
      variant="outlined"
      startIcon={<ContentCopyIcon />}
      disabled={busy != null}
      onClick={duplicate}
    >
      {busy === "duplicate" ? he.loading : he.duplicateExam}
    </Button>
  );

  const exportBtn = iconOnly ? (
    <Tooltip title={he.portableExportExam}>
      <IconButton size="small" aria-label={he.portableExportExam} onClick={() => setExportOpen(true)}>
        <FileUploadIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  ) : (
    <Button size={size} variant="outlined" startIcon={<FileUploadIcon />} onClick={() => setExportOpen(true)}>
      {he.portableExportExam}
    </Button>
  );

  const shareBtn = iconOnly ? (
    <Tooltip title={he.shareExam}>
      <IconButton size="small" aria-label={he.shareExam} onClick={() => setShareOpen(true)}>
        <ShareIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  ) : (
    <Button size={size} variant="outlined" startIcon={<ShareIcon />} onClick={() => setShareOpen(true)}>
      {he.shareExam}
    </Button>
  );

  const dialogs = (
    <>
      <ExamPortableExportDialog
        open={exportOpen}
        examId={exam.id}
        examTitle={exam.title}
        onClose={() => setExportOpen(false)}
      />

      <ShareWithTeacherDialog
        open={shareOpen}
        kind="exam"
        examId={exam.id}
        itemLabel={exam.title}
        onClose={() => setShareOpen(false)}
        onSent={onChanged}
      />

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} fullWidth maxWidth="xs">
        <DialogTitle>{he.deleteExam}</DialogTitle>
        <DialogContent>
          <Typography>{he.deleteExamConfirm}</Typography>
          <Typography fontWeight={600} sx={{ mt: 1 }}>
            {exam.title}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>{he.cancel}</Button>
          <Button variant="contained" color="error" onClick={remove} disabled={busy === "delete"}>
            {busy === "delete" ? he.loading : he.deleteExam}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  const moreMenuBtn = (
    <Tooltip title={he.moreExamActions}>
      <IconButton
        size="small"
        aria-label={he.moreExamActions}
        disabled={busy != null}
        onClick={(e) => setMenuAnchor(e.currentTarget)}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  const moreMenu = (
    <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu} dir="rtl">
      {primaryAction === "delete" && (
        <MenuItem
          disabled={busy != null}
          onClick={() => {
            closeMenu();
            void duplicate();
          }}
        >
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{he.duplicateExam}</ListItemText>
        </MenuItem>
      )}
      {menuExtras.map((item) => (
        <MenuItem
          key={item.key}
          disabled={busy != null || item.disabled}
          onClick={() => {
            closeMenu();
            item.onClick();
          }}
        >
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText>{item.label}</ListItemText>
        </MenuItem>
      ))}
      <MenuItem disabled={busy != null} onClick={() => { closeMenu(); setExportOpen(true); }}>
        <ListItemIcon>
          <FileUploadIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>{he.portableExportExam}</ListItemText>
      </MenuItem>
      <MenuItem disabled={busy != null} onClick={() => { closeMenu(); setShareOpen(true); }}>
        <ListItemIcon>
          <ShareIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>{he.shareExam}</ListItemText>
      </MenuItem>
      {exam.question_count > 0 && (
        <MenuItem disabled={busy != null} onClick={() => void downloadPdf()}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{busy === "pdf" ? he.loading : he.downloadExamPdf}</ListItemText>
        </MenuItem>
      )}
    </Menu>
  );

  if (courseRowLayout) {
    const thirdAction = primaryAction === "delete" ? deleteBtn : duplicateBtn;
    return (
      <>
        {thirdAction}
        {moreMenuBtn}
        {moreMenu}
        {dialogs}
      </>
    );
  }

  return (
    <>
      {duplicateBtn}
      {exportBtn}
      {shareBtn}
      <ExamPdfDownloadButton exam={exam} onError={onError} iconOnly={iconOnly} />
      {(!hideInactive || canDelete) && deleteBtn}
      {dialogs}
    </>
  );
}

export function ExamEditLink({
  examId,
  size = "small",
  returnTo,
  iconOnly = false,
  viewOnly = false,
}: {
  examId: number;
  size?: "small" | "medium";
  returnTo?: string;
  iconOnly?: boolean;
  /** מבחן déjà activé — icône צפייה (lecture seule) au lieu de עריכה. */
  viewOnly?: boolean;
}) {
  const to = returnTo
    ? `/teacher/exams/${examId}/edit?return=${encodeURIComponent(returnTo)}`
    : `/teacher/exams/${examId}/edit`;
  const label = viewOnly ? he.viewExam : he.editExam;
  const ActionIcon = viewOnly ? VisibilityOutlinedIcon : EditOutlinedIcon;

  if (iconOnly) {
    return (
      <Tooltip title={label}>
        <IconButton
          component={RouterLink}
          to={to}
          size="small"
          color="primary"
          aria-label={label}
        >
          <ActionIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Button
      size={size}
      variant="outlined"
      component={RouterLink}
      to={to}
      startIcon={<ActionIcon />}
    >
      {label}
    </Button>
  );
}

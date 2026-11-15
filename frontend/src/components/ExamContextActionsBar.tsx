import { Box } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import GradingIcon from "@mui/icons-material/GradingOutlined";
import LinkIcon from "@mui/icons-material/Link";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/StopOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import PracticeReleaseButtons from "./exams/PracticeReleaseButtons";
import ActivateExamDialog from "./exams/ActivateExamDialog";
import ConfirmSessionDialog from "./exams/ConfirmSessionDialog";
import ExamPrimaryButton from "./exams/ExamPrimaryButton";
import ActionsMenu, { type MenuAction } from "./ui/ActionsMenu";
import { examEditPath } from "./ExamActionButtons";
import type { Exam, ExamSession } from "../api/client";
import { useActivateExam } from "../hooks/useActivateExam";
import { useExamManageActions } from "../hooks/useExamManageActions";
import { useSessionLifecycle } from "../hooks/useSessionLifecycle";
import { he } from "../i18n/he";
import { examPrimaryAction } from "../utils/examPrimaryAction";
import { getExamOfferingActionRules, type ExamOfferingActionRules } from "../utils/examOfferingActionRules";
import { copyStudentExamLink } from "../utils/studentExamLink";

type ExamContextActionsBarProps = {
  exam: Exam;
  session?: ExamSession;
  courseId?: number;
  returnTo: string;
  hasQuestions?: boolean;
  /** Ajoute « עריכה » au menu (lignes de tableau). */
  showEditLink?: boolean;
  /** Tableau : boutons compacts. Page מטלה : taille normale. */
  compactMenu?: boolean;
  onChanged: () => void | Promise<void>;
  onError: (message: string) => void;
  onSuccess?: (message: string) => void;
  onDeleted?: () => void;
  onReopened?: () => void;
};

function isPracticeExam(exam: Exam): boolean {
  return exam.is_tirgoul === true || exam.kind === "tirgoul" || exam.kind === "task";
}

type LifecycleMenuInput = {
  props: ExamContextActionsBarProps;
  rules: ExamOfferingActionRules;
  showGrades: boolean;
  request: (kind: "deactivate" | "reopen", session: ExamSession) => void;
};

/** Entrées de menu liées au cycle de vie dans le קורס (lien élèves, annuler, rouvrir, notes). */
function lifecycleMenuActions({ props, rules, showGrades, request }: LifecycleMenuInput): MenuAction[] {
  const { exam, session, courseId, returnTo, showEditLink, onSuccess, onError } = props;
  const items: MenuAction[] = [];
  if (showEditLink) {
    const viewOnly = exam.can_delete === false;
    items.push({ key: "edit", label: viewOnly ? he.viewExam : he.editExam, icon: viewOnly ? <VisibilityOutlinedIcon fontSize="small" /> : <EditOutlinedIcon fontSize="small" />, to: examEditPath(exam.id, returnTo) });
  }
  if (rules.showStudentLink && session && courseId) {
    const copy = () => void copyStudentExamLink(courseId, session.id).then(() => onSuccess?.(he.studentExamLinkCopied)).catch(() => onError(he.portableExportCopyFailed));
    items.push({ key: "link", label: he.examStudentLinkCopy, icon: <LinkIcon fontSize="small" />, onClick: copy });
  }
  if (showGrades && rules.gradesPath) items.push({ key: "grades", label: he.viewExamGrades, icon: <GradingIcon fontSize="small" />, to: rules.gradesPath });
  if (rules.showDeactivate && session) items.push({ key: "deactivate", label: he.cancelActivation, icon: <StopIcon fontSize="small" />, onClick: () => request("deactivate", session) });
  if (rules.showReopen && session) items.push({ key: "reopen", label: he.reopenExam, icon: <PlayArrowIcon fontSize="small" />, onClick: () => request("reopen", session) });
  return items;
}

function useBarState(props: ExamContextActionsBarProps) {
  const { exam, session, courseId, onChanged, onError, onSuccess, onReopened, onDeleted } = props;
  const hasOffering = courseId != null && !Number.isNaN(courseId);
  const reload = async () => {
    await onChanged();
  };
  const lifecycle = useSessionLifecycle({ reload, onError, onSuccess, onReopened: () => onReopened?.() });
  const activation = useActivateExam({ offerings: [], reload, onError, onSuccess });
  const manage = useExamManageActions(exam, { onChanged: () => void onChanged(), onError, onDeleted, offeringId: hasOffering ? courseId : undefined });
  const rules = getExamOfferingActionRules(exam, session, courseId, props.hasQuestions ?? exam.question_count > 0);
  return { hasOffering, lifecycle, activation, manage, rules };
}

/**
 * Actions d'une מטלה dans un קורס : un bouton principal selon l'état
 * (הפעלה → סגירה → פרסום ציונים → ציונים) + menu « ⋮ » pour tout le reste.
 */
export default function ExamContextActionsBar(props: ExamContextActionsBarProps) {
  const { exam, session, courseId, compactMenu = true, onChanged, onError, onSuccess } = props;
  const { hasOffering, lifecycle, activation, manage, rules } = useBarState(props);
  const practice = isPracticeExam(exam);
  const primary = hasOffering && !practice ? examPrimaryAction(rules) : "none";
  const size = compactMenu ? "small" : "medium";
  const menu = [...lifecycleMenuActions({ props, rules, showGrades: primary !== "grades" && rules.canViewGrades, request: lifecycle.request }), ...manage.actions];
  const busy = session != null && lifecycle.busy?.id === session.id;

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
        {hasOffering && practice && (
          <PracticeReleaseButtons
            practice
            status={session?.status}
            gradingLocked={session?.grading_locked}
            hasContent={props.hasQuestions ?? exam.question_count > 0}
            examId={exam.id}
            sessionId={session?.id}
            offeringId={courseId}
            onChanged={onChanged}
            onError={onError}
            onSuccess={onSuccess}
          />
        )}
        <ExamPrimaryButton
          kind={primary}
          size={size}
          loading={busy}
          gradesPath={rules.gradesPath}
          onActivate={() => activation.start(exam, String(courseId))}
          onClose={() => session && lifecycle.request("close", session)}
          onPublish={() => session && lifecycle.request("publish", session)}
        />
        <ActionsMenu actions={menu} />
      </Box>
      {manage.dialogs}
      <ActivateExamDialog {...activation.dialog} />
      <ConfirmSessionDialog
        kind={lifecycle.pending?.kind ?? null}
        session={lifecycle.pending?.session ?? null}
        busy={lifecycle.busy !== null}
        onClose={lifecycle.cancel}
        onConfirm={() => void lifecycle.confirm()}
      />
    </>
  );
}

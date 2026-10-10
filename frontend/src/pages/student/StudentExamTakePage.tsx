import { useParams } from "react-router-dom";
import { Alert, Box } from "@mui/material";
import ExamFocusOverlay from "../../components/ExamFocusOverlay";
import ExamIntegrityRulesDialog from "../../components/ExamIntegrityRulesDialog";
import ExamTakeBanners from "../../components/student/exam/ExamTakeBanners";
import ExamTakeBody from "../../components/student/exam/ExamTakeBody";
import ExamTakeHeader from "../../components/student/exam/ExamTakeHeader";
import Spinner from "../../components/ui/Spinner";
import { useExamTake } from "../../hooks/examTake/useExamTake";
import { he } from "../../i18n/he";

/** Passation d'un examen (officiel, tirgoul ou entraînement) — page mince composée de hooks et de composants. */
export default function StudentExamTakePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const id = Number(sessionId);
  const state = useExamTake(id);
  const { paper, loading, error } = state.loader;

  if (loading && !paper) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <Spinner />
      </Box>
    );
  }
  if (!paper) return <Alert severity="error">{error || he.errorGeneric}</Alert>;

  return (
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }}>
      <ExamFocusOverlay visible={state.examInProgress && state.tabHidden} />
      <ExamIntegrityRulesDialog
        open={state.rulesPending}
        examTitle={paper.exam_title}
        loading={state.actions.acceptingRules}
        onAccept={state.actions.acceptRules}
      />
      <ExamTakeHeader paper={paper} sessionId={id} showTitle={!state.showNav} />
      <ExamTakeBanners state={state} />
      <ExamTakeBody state={state} id={id} />
    </Box>
  );
}

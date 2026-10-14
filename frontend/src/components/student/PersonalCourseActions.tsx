import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ShareIcon from "@mui/icons-material/Share";
import ShareWithTeacherDialog from "../ShareWithTeacherDialog";
import type { CourseOffering, StudentExamSessionWithAttempt } from "../../api/client";
import { he } from "../../i18n/he";

function tirgoulCreatePath(offering: CourseOffering): string {
  const back = encodeURIComponent(`/student/courses/${offering.id}`);
  return `/student/tirgoulim/new?catalog_course_id=${offering.catalog_course_id}&offering_id=${offering.id}&return=${back}`;
}

export function tirgoulEditPath(offeringId: number, examId: number): string {
  const back = encodeURIComponent(`/student/courses/${offeringId}`);
  return `/student/tirgoulim/${examId}/edit?return=${back}`;
}

type ShareTarget = { kind: "exam" | "catalog"; examId?: number; catalogId?: number; label: string };

/** Ajout et partage d'un tirgoul sur une matière personnelle. */
export function usePersonalShares(offering: CourseOffering | null) {
  const [target, setTarget] = useState<ShareTarget | null>(null);
  const [notice, setNotice] = useState("");
  const shareSubject = () => {
    if (!offering) return;
    setTarget({ kind: "catalog", catalogId: offering.catalog_course_id, label: offering.catalog_name });
  };
  const shareExam = (session: StudentExamSessionWithAttempt) => {
    setTarget({ kind: "exam", examId: session.exam_id, label: session.exam_title });
  };
  return { target, setTarget, notice, setNotice, shareSubject, shareExam };
}

export function PersonalCourseButtons({
  offering,
  onShare,
}: {
  offering: CourseOffering;
  onShare: () => void;
}) {
  const navigate = useNavigate();
  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
      <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => navigate(tirgoulCreatePath(offering))}>
        {he.createTirgoul}
      </Button>
      <Button variant="outlined" size="small" startIcon={<ShareIcon />} onClick={onShare}>
        {he.shareSubject}
      </Button>
    </Box>
  );
}

export function PersonalShareDialog({
  target,
  onClose,
  onSent,
}: {
  target: ShareTarget | null;
  onClose: () => void;
  onSent: () => void;
}) {
  return (
    <ShareWithTeacherDialog
      open={!!target}
      kind={target?.kind ?? "catalog"}
      examId={target?.examId}
      catalogId={target?.catalogId}
      itemLabel={target?.label ?? ""}
      emailLabel={he.shareRecipientEmail}
      onClose={onClose}
      onSent={onSent}
    />
  );
}

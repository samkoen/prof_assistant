import { Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import type { MoodleCourseItem, MoodleStudentImportResult } from "../../api/moodle";
import { he } from "../../i18n/he";
import MoodleImportReport from "./MoodleImportReport";

interface Props {
  course: MoodleCourseItem;
  busy: boolean;
  report: MoodleStudentImportResult | null;
  showReport: boolean;
  onCreate: () => void;
  onLink: () => void;
  onStudents: () => void;
}

export default function MoodleCourseRow({ course, busy, report, showReport, onCreate, onLink, onStudents }: Props) {
  return (
    <Stack dir="rtl" spacing={1} sx={{ py: 1.5, borderBottom: 1, borderColor: "divider" }}>
      <Typography>{course.fullname}</Typography>
      <Typography variant="body2" color="text.secondary" dir="ltr">{course.shortname}</Typography>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        {course.offering_id == null ? (
          <>
            <Button size="small" variant="contained" disabled={busy} onClick={onCreate}>{he.moodleImportCreate}</Button>
            <Button size="small" variant="outlined" disabled={busy} onClick={onLink}>{he.moodleLinkExisting}</Button>
          </>
        ) : (
          <>
            <Button size="small" variant="contained" disabled={busy} onClick={onStudents}>{he.moodleImportStudents}</Button>
            <Button size="small" component={RouterLink} to={`/teacher/courses/${course.offering_id}/students`}>{he.moodleOpenCourse}</Button>
          </>
        )}
      </Stack>
      {showReport && report && <MoodleImportReport report={report} />}
    </Stack>
  );
}

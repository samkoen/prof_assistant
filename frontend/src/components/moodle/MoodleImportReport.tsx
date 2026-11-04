import { List, ListItem, ListItemText, Typography } from "@mui/material";
import type { MoodleStudentImportResult } from "../../api/moodle";
import { he } from "../../i18n/he";

export default function MoodleImportReport({ report }: { report: MoodleStudentImportResult }) {
  return (
    <div dir="rtl">
      <Typography variant="body2">{he.moodleEnrolled(report.enrolled)} · {he.moodleAlready(report.already)}</Typography>
      {report.unknown.length > 0 && <StudentList title={he.moodleUnknownStudents} rows={report.unknown.map((row) => row.email || row.fullname)} />}
      {report.skipped.length > 0 && <StudentList title={he.moodleSkipped} rows={report.skipped.map((row) => `${row.fullname} — ${row.reason}`)} />}
    </div>
  );
}

function StudentList({ title, rows }: { title: string; rows: string[] }) {
  return (
    <>
      <Typography variant="body2" sx={{ mt: 1 }}>{title}</Typography>
      <List dense>
        {rows.map((row) => (
          <ListItem key={row} disablePadding>
            <ListItemText primary={row} slotProps={{ primary: { dir: "ltr" } }} />
          </ListItem>
        ))}
      </List>
    </>
  );
}

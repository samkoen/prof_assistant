import { Alert, Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import { he } from "../../i18n/he";
import { useMoodleGrades } from "../../hooks/useMoodleGrades";

export default function MoodleGradePanel({ sessionId, onSuccess }: { sessionId: number; onSuccess: (message: string) => void }) {
  const grades = useMoodleGrades(sessionId, onSuccess);
  if (grades.error && !grades.view) return <Alert severity="error" sx={{ mb: 2 }}>{grades.error}</Alert>;
  if (!grades.view?.linked) return null;
  return (
    <Box dir="rtl" sx={{ mb: 2, display: "grid", gap: 1.5, maxWidth: 560 }}>
      <Typography variant="h6">{he.moodlePushGrades}</Typography>
      {grades.error && <Alert severity="error">{grades.error}</Alert>}
      {grades.view.assignments.length === 0 ? (
        <Alert severity="info">{he.moodleNoAssignments}</Alert>
      ) : (
        <TextField select label={he.moodleSelectAssignment} value={grades.assignId} onChange={(event) => grades.setAssignId(Number(event.target.value))}>
          {grades.view.assignments.map((item) => (
            <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
          ))}
        </TextField>
      )}
      <Button variant="outlined" disabled={grades.busy || grades.assignId === ""} onClick={() => void grades.push()}>
        {he.moodlePushGrades}
      </Button>
      {grades.skipped.length > 0 && grades.skipped.map((row) => (
        <Typography key={row.student_name} variant="body2" color="text.secondary">{row.student_name} — {row.reason}</Typography>
      ))}
    </Box>
  );
}

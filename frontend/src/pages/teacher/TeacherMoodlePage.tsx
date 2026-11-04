import { Alert, Box } from "@mui/material";
import ListPageToolbar from "../../components/ListPageToolbar";
import MoodleConnectionCard from "../../components/moodle/MoodleConnectionCard";
import MoodleCourseList from "../../components/moodle/MoodleCourseList";
import { useMoodleConnection } from "../../hooks/useMoodleConnection";
import { useMoodleCourses } from "../../hooks/useMoodleCourses";
import { he } from "../../i18n/he";

export default function TeacherMoodlePage() {
  const connection = useMoodleConnection();
  const courses = useMoodleCourses(connection.status?.connected === true);
  const error = courses.error || connection.error;
  const success = courses.notice || connection.success;
  return (
    <Box dir="rtl" sx={{ width: "100%", minWidth: 0 }}>
      <ListPageToolbar title={he.moodleMenu} subtitle={he.moodleSubtitle} />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => { connection.setError(""); courses.setError(""); }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => { connection.setSuccess(""); courses.setNotice(""); }}>
          {success}
        </Alert>
      )}
      <MoodleConnectionCard connection={connection} />
      {connection.status?.connected && <MoodleCourseList courses={courses} />}
    </Box>
  );
}

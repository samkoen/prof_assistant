import { Link as RouterLink } from "react-router-dom";
import { Tab, Tabs } from "@mui/material";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import { he } from "../../i18n/he";

export type CourseSection = "exams" | "students";

/** Navigation interne d'un קורס : מטלות / תלמידים, toujours au même endroit. */
export default function CourseSectionTabs({ courseId, value }: { courseId: number; value: CourseSection }) {
  return (
    <Tabs value={value} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 2.5, borderBottom: 1, borderColor: "divider" }}>
      <Tab value="exams" component={RouterLink} to={`/teacher/courses/${courseId}/exams`} icon={<AssignmentOutlinedIcon fontSize="small" />} iconPosition="start" label={he.coursesExamsAction} />
      <Tab value="students" component={RouterLink} to={`/teacher/courses/${courseId}/students`} icon={<PeopleOutlineIcon fontSize="small" />} iconPosition="start" label={he.coursesStudentsAction} />
    </Tabs>
  );
}

import { useState } from "react";
import { Box, Skeleton, Typography } from "@mui/material";
import type { MoodleCourseItem } from "../../api/moodle";
import type { MoodleCourseState } from "../../hooks/useMoodleCourses";
import { he } from "../../i18n/he";
import EmptyState from "../ui/EmptyState";
import MoodleCourseRow from "./MoodleCourseRow";
import MoodleLinkDialog from "./MoodleLinkDialog";

export default function MoodleCourseList({ courses }: { courses: MoodleCourseState }) {
  const [linking, setLinking] = useState<MoodleCourseItem | null>(null);
  if (courses.loading && courses.courses.length === 0) return <Skeleton variant="rounded" height={180} />;
  return (
    <Box dir="rtl">
      <Typography variant="h6" sx={{ mb: 1 }}>{he.moodleCourses}</Typography>
      {courses.courses.length === 0 ? (
        <EmptyState title={he.moodleNoCourses} />
      ) : (
        courses.courses.map((course) => (
          <MoodleCourseRow
            key={course.id}
            course={course}
            busy={courses.busy}
            report={courses.report}
            showReport={courses.reportOfferingId === course.offering_id && course.offering_id != null}
            onCreate={() => void courses.createCourse(course.id)}
            onLink={() => setLinking(course)}
            onStudents={() => course.offering_id != null && void courses.importStudents(course.offering_id)}
          />
        ))
      )}
      <MoodleLinkDialog
        course={linking}
        offerings={courses.offerings}
        busy={courses.busy}
        onClose={() => setLinking(null)}
        onLink={(offeringId) => {
          if (!linking) return;
          void courses.linkCourse(linking.id, offeringId).then(() => setLinking(null));
        }}
      />
    </Box>
  );
}

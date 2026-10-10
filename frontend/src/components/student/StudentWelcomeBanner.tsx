import { Link } from "react-router-dom";
import { Button } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SchoolIcon from "@mui/icons-material/School";
import PageHeroBanner from "../ui/PageHeroBanner";
import type { StudentExamSessionWithAttempt } from "../../api/client";
import { he } from "../../i18n/he";
import { brand } from "../../theme/brand";
import { greetingFor } from "../../utils/teacherDashboard";
import { studentExamView } from "../../utils/studentExams";

type StudentWelcomeBannerProps = {
  name: string;
  headline: string;
  next: StudentExamSessionWithAttempt | null;
  hour?: number;
};

const ctaSx = {
  bgcolor: brand.white,
  color: brand.violet800,
  fontWeight: 800,
  background: brand.white,
  "&:hover": { background: brand.violet50 },
} as const;

function Cta({ next }: { next: StudentExamSessionWithAttempt | null }) {
  if (next) {
    const label = studentExamView(next, next.attempt).actionLabel;
    return (
      <Button component={Link} to={`/student/exams/${next.id}`} variant="contained" size="large" startIcon={<PlayArrowIcon />} sx={ctaSx}>
        {label}
      </Button>
    );
  }
  return (
    <Button component={Link} to="/student/join-course" variant="contained" size="large" startIcon={<SchoolIcon />} sx={ctaSx}>
      {he.joinByTeacherTitle}
    </Button>
  );
}

/** Bandeau d'accueil élève : salutation, synthèse du jour et action principale (reprendre / démarrer). */
export default function StudentWelcomeBanner({ name, headline, next, hour = new Date().getHours() }: StudentWelcomeBannerProps) {
  const greeting = name ? `${greetingFor(hour)}, ${name}` : greetingFor(hour);
  return <PageHeroBanner title={greeting} subtitle={headline} actions={<Cta next={next} />} />;
}

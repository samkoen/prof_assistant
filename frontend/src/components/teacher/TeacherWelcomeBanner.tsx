import { Link } from "react-router-dom";
import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PageHeroBanner from "../ui/PageHeroBanner";
import { he } from "../../i18n/he";
import { brand } from "../../theme/brand";
import { greetingFor } from "../../utils/teacherDashboard";

type TeacherWelcomeBannerProps = {
  name: string;
  headline: string;
  hour?: number;
};

const ctaSx = {
  bgcolor: brand.white,
  color: brand.violet800,
  fontWeight: 800,
  background: brand.white,
  "&:hover": { background: brand.violet50 },
} as const;

/** Bandeau d'accueil : salutation, synthèse du jour et action principale. */
export default function TeacherWelcomeBanner({ name, headline, hour = new Date().getHours() }: TeacherWelcomeBannerProps) {
  const greeting = name ? `${greetingFor(hour)}, ${name}` : greetingFor(hour);
  return (
    <PageHeroBanner
      title={greeting}
      subtitle={headline}
      actions={
        <Button component={Link} to="/teacher/exams/new" variant="contained" size="large" startIcon={<AddIcon />} sx={ctaSx}>
          {he.createExam}
        </Button>
      }
    />
  );
}

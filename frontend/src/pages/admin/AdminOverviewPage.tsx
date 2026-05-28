import { useCallback, useState } from "react";
import { alpha, Box, Button, Chip, Grid, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import AutoDeleteIcon from "@mui/icons-material/AutoDelete";
import { useNavigate } from "react-router-dom";
import DashboardNavCard from "../../components/ui/DashboardNavCard";
import PageHeroBanner from "../../components/ui/PageHeroBanner";
import UnverifiedStudentsPanel from "../../components/UnverifiedStudentsPanel";
import { he } from "../../i18n/he";
import { hebrewAlignRightSx } from "../../styles/hebrewAlign";

const navCards = [
  {
    title: he.students,
    desc: he.studentsSubtitle,
    path: "/admin/students",
    icon: <PeopleIcon />,
    accent: "primary" as const,
  },
  {
    title: he.adminUsers,
    desc: he.adminUsersCardDesc,
    path: "/admin/users",
    icon: <PeopleIcon />,
    accent: "secondary" as const,
  },
  {
    title: he.allCourses,
    desc: he.allCoursesCardDesc,
    path: "/admin/courses",
    icon: <SchoolIcon />,
    accent: "success" as const,
  },
  {
    title: he.aiExplanationsAdminTitle,
    desc: he.aiExplanationsAdminSubtitle,
    path: "/admin/ai-explanations",
    icon: <AutoDeleteIcon />,
    accent: "secondary" as const,
  },
];

export default function AdminOverviewPage() {
  const navigate = useNavigate();
  const [unverifiedCount, setUnverifiedCount] = useState(0);
  const [unverifiedLoaded, setUnverifiedLoaded] = useState(false);

  const handleUnverifiedCount = useCallback((count: number) => {
    setUnverifiedCount(count);
    setUnverifiedLoaded(true);
  }, []);

  return (
    <Box sx={hebrewAlignRightSx}>
      <PageHeroBanner
        title={he.dashboard}
        subtitle={he.adminWelcome}
        actions={
          <>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/admin/students")}
              sx={{ bgcolor: "#fff", color: "primary.dark", "&:hover": { bgcolor: alpha("#fff", 0.9) } }}
            >
              {he.newStudent}
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => navigate("/admin/users")}
              sx={{ borderColor: "#fff", color: "#fff", "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.12)" } }}
            >
              {he.newUser}
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={() => navigate("/admin/courses")}
            >
              {he.newCourse}
            </Button>
            {unverifiedCount > 0 && (
              <Chip
                label={`${he.pendingApprovals}: ${unverifiedCount}`}
                onClick={() =>
                  document.getElementById("admin-pending-requests")?.scrollIntoView({ behavior: "smooth" })
                }
                sx={{ cursor: "pointer", fontWeight: 700, bgcolor: "rgba(255,255,255,0.2)", color: "#fff" }}
              />
            )}
          </>
        }
      />

      <Box id="admin-pending-requests" sx={{ mb: 4, ...hebrewAlignRightSx }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          {he.pendingApprovals}
        </Typography>
        {unverifiedLoaded && unverifiedCount === 0 ? (
          <Typography color="text.secondary">{he.noPendingRequests}</Typography>
        ) : (
          <UnverifiedStudentsPanel onCountChange={handleUnverifiedCount} />
        )}
      </Box>

      <Grid container spacing={2.5}>
        {navCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.path}>
            <DashboardNavCard
              to={card.path}
              title={card.title}
              description={card.desc}
              icon={card.icon}
              accent={card.accent}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

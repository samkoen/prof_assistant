import { Box, Button, Card, CardContent, Grid, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import { Link, useNavigate } from "react-router-dom";
import { he } from "../../i18n/he";

const cards = [
  {
    title: he.students,
    desc: he.studentsSubtitle,
    path: "/admin/students",
    icon: <PeopleIcon fontSize="large" color="primary" />,
  },
  {
    title: he.adminUsers,
    desc: he.adminUsersCardDesc,
    path: "/admin/users",
    icon: <PeopleIcon fontSize="large" color="action" />,
  },
  {
    title: he.allCourses,
    desc: he.allCoursesCardDesc,
    path: "/admin/courses",
    icon: <SchoolIcon fontSize="large" color="secondary" />,
  },
];

export default function AdminOverviewPage() {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {he.dashboard}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        {he.adminWelcome}
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/admin/students")}
        >
          {he.newStudent}
        </Button>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => navigate("/admin/users")}
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
      </Box>

      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.path}>
            <Card
              component={Link}
              to={card.path}
              sx={{
                textDecoration: "none",
                height: "100%",
                transition: "box-shadow 0.2s",
                "&:hover": { boxShadow: 4 },
              }}
            >
              <CardContent>
                <Box mb={1}>{card.icon}</Box>
                <Typography variant="h6" fontWeight={600} color="text.primary">
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

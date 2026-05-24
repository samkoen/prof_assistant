import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PeopleIcon from "@mui/icons-material/People";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SchoolIcon from "@mui/icons-material/School";
import { api, type Enrollment } from "../../api/client";
import { he } from "../../i18n/he";

const cards = [
  {
    title: he.students,
    desc: he.studentsSubtitle,
    path: "/teacher/students",
    icon: <PeopleIcon fontSize="large" color="primary" />,
  },
  {
    title: he.myCourses,
    desc: he.manageCourseStudents,
    path: "/teacher/courses",
    icon: <MenuBookIcon fontSize="large" color="secondary" />,
  },
  {
    title: he.pendingApprovals,
    desc: he.enrollmentsSubtitle,
    path: "/teacher/enrollments",
    icon: <SchoolIcon fontSize="large" color="warning" />,
  },
];

export default function TeacherOverviewPage() {
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    api<Enrollment[]>("/api/enrollments/pending")
      .then((list) => setPendingCount(list.length))
      .catch(() => setPendingCount(0));
  }, []);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {he.dashboard}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        {he.welcome}
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/teacher/students")}
        >
          {he.newStudent}
        </Button>
        <Button
          variant="outlined"
          startIcon={<MenuBookIcon />}
          onClick={() => navigate("/teacher/courses")}
        >
          {he.createCourse}
        </Button>
        {pendingCount > 0 && (
          <Chip
            label={`${he.pendingApprovals}: ${pendingCount}`}
            color="warning"
            onClick={() => navigate("/teacher/enrollments")}
            sx={{ cursor: "pointer" }}
          />
        )}
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

import { lazy, Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";
import { Navigate, Route, Routes } from "react-router-dom";

import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { getHomePath } from "./config/menuItems";
import { useAuth } from "./context/AuthContext";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const StudentJoinCoursePage = lazy(() => import("./pages/StudentJoinCoursePage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

const AdminOverviewPage = lazy(() => import("./pages/admin/AdminOverviewPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminCoursesPage = lazy(() => import("./pages/admin/AdminCoursesPage"));
const AdminStudentsPage = lazy(() => import("./pages/admin/AdminStudentsPage"));
const AdminAiExplanationsPage = lazy(() => import("./pages/admin/AdminAiExplanationsPage"));

const TeacherOverviewPage = lazy(() => import("./pages/teacher/TeacherOverviewPage"));
const TeacherStudentsPage = lazy(() => import("./pages/teacher/TeacherStudentsPage"));
const TeacherCoursesPage = lazy(() => import("./pages/teacher/TeacherCoursesPage"));
const TeacherCourseStudentsPage = lazy(() => import("./pages/teacher/TeacherCourseStudentsPage"));
const TeacherCourseExamsPage = lazy(() => import("./pages/teacher/TeacherCourseExamsPage"));
const TeacherExamResultsPage = lazy(() => import("./pages/teacher/TeacherExamResultsPage"));
const TeacherEnrollmentsPage = lazy(() => import("./pages/teacher/TeacherEnrollmentsPage"));
const TeacherCatalogCoursesPage = lazy(() => import("./pages/teacher/TeacherCatalogCoursesPage"));
const TeacherSharesPage = lazy(() => import("./pages/teacher/TeacherSharesPage"));
const TeacherExamsPage = lazy(() => import("./pages/teacher/TeacherExamsPage"));
const TeacherExamEditorPage = lazy(() => import("./pages/teacher/TeacherExamEditorPage"));
const TeacherExamCreatePage = lazy(() => import("./pages/teacher/TeacherExamCreatePage"));

const StudentOverviewPage = lazy(() => import("./pages/student/StudentOverviewPage"));
const StudentCoursesPage = lazy(() => import("./pages/student/StudentCoursesPage"));
const StudentCourseExamsPage = lazy(() => import("./pages/student/StudentCourseExamsPage"));
const StudentExamTakePage = lazy(() => import("./pages/student/StudentExamTakePage"));
const StudentAllExamsPage = lazy(() => import("./pages/student/StudentAllExamsPage"));
const StudentJoinByTeacherPage = lazy(() => import("./pages/student/StudentJoinByTeacherPage"));

function PageLoader() {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ bgcolor: "transparent" }}
    >
      <CircularProgress size={40} thickness={4} />
    </Box>
  );
}

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={getHomePath(user.role)} replace />;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/join/t/:joinToken" element={<StudentJoinCoursePage />} />
        <Route path="/join/:offeringId" element={<StudentJoinCoursePage />} />

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="/admin" element={<AdminOverviewPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/students" element={<AdminStudentsPage />} />
            <Route path="/admin/courses" element={<AdminCoursesPage />} />
            <Route path="/admin/ai-explanations" element={<AdminAiExplanationsPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={["teacher"]} />}>
            <Route path="/teacher" element={<TeacherOverviewPage />} />
            <Route path="/teacher/students" element={<TeacherStudentsPage />} />
            <Route path="/teacher/courses" element={<TeacherCoursesPage />} />
            <Route path="/teacher/courses/:courseId/students" element={<TeacherCourseStudentsPage />} />
            <Route path="/teacher/courses/:courseId/exams" element={<TeacherCourseExamsPage />} />
            <Route
              path="/teacher/courses/:courseId/exams/sessions/:sessionId/results"
              element={<TeacherExamResultsPage />}
            />
            <Route path="/teacher/enrollments" element={<TeacherEnrollmentsPage />} />
            <Route path="/teacher/shares" element={<TeacherSharesPage />} />
            <Route path="/teacher/catalog-courses" element={<TeacherCatalogCoursesPage />} />
            <Route path="/teacher/exams" element={<TeacherExamsPage />} />
            <Route path="/teacher/exams/new" element={<TeacherExamCreatePage />} />
            <Route path="/teacher/exams/:examId/edit" element={<TeacherExamEditorPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={["student"]} />}>
            <Route path="/student" element={<StudentOverviewPage />} />
            <Route path="/student/courses" element={<StudentCoursesPage />} />
            <Route path="/student/courses/:offeringId" element={<StudentCourseExamsPage />} />
            <Route path="/student/exams" element={<StudentAllExamsPage />} />
            <Route path="/student/exams/:sessionId" element={<StudentExamTakePage />} />
            <Route path="/student/join-course" element={<StudentJoinByTeacherPage />} />
            <Route path="/student/open-courses" element={<StudentJoinByTeacherPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

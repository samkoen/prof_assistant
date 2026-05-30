import { Navigate, Route, Routes } from "react-router-dom";

import DashboardLayout from "./components/DashboardLayout";

import ProtectedRoute from "./components/ProtectedRoute";

import { getHomePath } from "./config/menuItems";

import LoginPage from "./pages/LoginPage";

import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

import AdminOverviewPage from "./pages/admin/AdminOverviewPage";

import AdminUsersPage from "./pages/admin/AdminUsersPage";

import AdminCoursesPage from "./pages/admin/AdminCoursesPage";
import AdminStudentsPage from "./pages/admin/AdminStudentsPage";
import AdminAiExplanationsPage from "./pages/admin/AdminAiExplanationsPage";

import TeacherOverviewPage from "./pages/teacher/TeacherOverviewPage";

import TeacherStudentsPage from "./pages/teacher/TeacherStudentsPage";

import TeacherCoursesPage from "./pages/teacher/TeacherCoursesPage";

import TeacherCourseStudentsPage from "./pages/teacher/TeacherCourseStudentsPage";

import TeacherCourseExamsPage from "./pages/teacher/TeacherCourseExamsPage";

import TeacherExamResultsPage from "./pages/teacher/TeacherExamResultsPage";

import TeacherEnrollmentsPage from "./pages/teacher/TeacherEnrollmentsPage";

import TeacherCatalogCoursesPage from "./pages/teacher/TeacherCatalogCoursesPage";

import TeacherExamsPage from "./pages/teacher/TeacherExamsPage";

import TeacherExamEditorPage from "./pages/teacher/TeacherExamEditorPage";

import TeacherExamCreatePage from "./pages/teacher/TeacherExamCreatePage";

import StudentOverviewPage from "./pages/student/StudentOverviewPage";

import StudentCoursesPage from "./pages/student/StudentCoursesPage";

import StudentCourseExamsPage from "./pages/student/StudentCourseExamsPage";

import StudentExamTakePage from "./pages/student/StudentExamTakePage";

import StudentAllExamsPage from "./pages/student/StudentAllExamsPage";

import StudentOpenCoursesPage from "./pages/student/StudentOpenCoursesPage";

import StudentJoinCoursePage from "./pages/StudentJoinCoursePage";

import { useAuth } from "./context/AuthContext";



function HomeRedirect() {

  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={getHomePath(user.role)} replace />;

}



export default function App() {

  return (

    <Routes>

      <Route path="/login" element={<LoginPage />} />

      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      <Route path="/join/:offeringId" element={<StudentJoinCoursePage />} />



      <Route

        element={

          <ProtectedRoute>

            <DashboardLayout />

          </ProtectedRoute>

        }

      >

        <Route path="/" element={<HomeRedirect />} />



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

          <Route path="/student/open-courses" element={<StudentOpenCoursesPage />} />

        </Route>

      </Route>

    </Routes>

  );

}


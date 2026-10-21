import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import BrandPageLoader from "./components/ui/BrandPageLoader";

import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const StudentJoinCoursePage = lazy(() => import("./pages/StudentJoinCoursePage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const PublicContactPage = lazy(() => import("./pages/PublicContactPage"));
const BillingReturnPage = lazy(() => import("./pages/BillingReturnPage"));
const PublicEntry = lazy(() => import("./pages/PublicEntry"));
const PublicLegalPage = lazy(() => import("./pages/PublicLegalPage"));

const AdminOverviewPage = lazy(() => import("./pages/admin/AdminOverviewPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminCoursesPage = lazy(() => import("./pages/admin/AdminCoursesPage"));
const AdminStudentsPage = lazy(() => import("./pages/admin/AdminStudentsPage"));
const AdminAiExplanationsPage = lazy(() => import("./pages/admin/AdminAiExplanationsPage"));
const AdminAiPromptsPage = lazy(() => import("./pages/admin/AdminAiPromptsPage"));
const AdminAiBillingPage = lazy(() => import("./pages/admin/AdminAiBillingPage"));

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
  return <BrandPageLoader fullScreen />;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<PublicEntry />} />
        <Route path="/terms" element={<PublicLegalPage kind="terms" />} />
        <Route path="/privacy" element={<PublicLegalPage kind="privacy" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/contact-us" element={<PublicContactPage />} />
        <Route path="/billing/return" element={<BillingReturnPage />} />
        <Route path="/join/t/:joinToken" element={<StudentJoinCoursePage />} />
        <Route path="/join/:offeringId" element={<StudentJoinCoursePage />} />

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/contact" element={<ContactPage />} />

          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="/admin" element={<AdminOverviewPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/students" element={<AdminStudentsPage />} />
            <Route path="/admin/courses" element={<AdminCoursesPage />} />
            <Route path="/admin/ai-explanations" element={<AdminAiExplanationsPage />} />
            <Route path="/admin/ai-prompts" element={<AdminAiPromptsPage />} />
            <Route path="/admin/ai-billing" element={<AdminAiBillingPage />} />
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
            <Route path="/student/shares" element={<TeacherSharesPage audience="student" />} />
            <Route path="/student/tirgoulim/new" element={<TeacherExamCreatePage forceTirgoul />} />
            <Route path="/student/tirgoulim/:examId/edit" element={<TeacherExamEditorPage />} />
            <Route path="/student/join-course" element={<StudentJoinByTeacherPage />} />
            <Route path="/student/open-courses" element={<StudentJoinByTeacherPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

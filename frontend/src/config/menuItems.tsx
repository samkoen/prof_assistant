import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AutoDeleteIcon from "@mui/icons-material/AutoDelete";
import DescriptionIcon from "@mui/icons-material/Description";
import ShareIcon from "@mui/icons-material/Share";
import QuizIcon from "@mui/icons-material/Quiz";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PersonIcon from "@mui/icons-material/Person";
import type { ReactNode } from "react";
import type { UserRole } from "../api/client";
import { he } from "../i18n/he";

export interface MenuItemDef {
  text: string;
  icon: ReactNode;
  path: string;
  matchPathPrefix?: string;
  /** Clé pour badge dynamique (ex. pending enrollments). */
  badgeKey?: "pendingEnrollments";
}

export const PROFILE_PATH = "/profile";

const profileMenuItem: MenuItemDef = {
  text: he.myProfile,
  icon: <PersonIcon />,
  path: PROFILE_PATH,
};

export function getMenuItems(role: UserRole): MenuItemDef[] {
  if (role === "admin") {
    return [
      { text: he.dashboard, icon: <DashboardIcon />, path: "/admin" },
      { text: he.adminUsers, icon: <PeopleIcon />, path: "/admin/users" },
      { text: he.students, icon: <SchoolIcon />, path: "/admin/students" },
      { text: he.allCourses, icon: <MenuBookIcon />, path: "/admin/courses" },
      { text: he.aiExplanationsAdminTitle, icon: <AutoDeleteIcon />, path: "/admin/ai-explanations" },
      { text: he.aiPromptsAdminTitle, icon: <DescriptionIcon />, path: "/admin/ai-prompts" },
      profileMenuItem,
    ];
  }
  if (role === "teacher") {
    return [
      { text: he.dashboard, icon: <DashboardIcon />, path: "/teacher" },
      { text: he.students, icon: <PeopleIcon />, path: "/teacher/students" },
      { text: he.catalogCourses, icon: <MenuBookIcon />, path: "/teacher/catalog-courses" },
      { text: he.myCourses, icon: <SchoolIcon />, path: "/teacher/courses" },
      { text: he.exams, icon: <QuizIcon />, path: "/teacher/exams" },
      {
        text: he.pendingApprovals,
        icon: <SchoolIcon />,
        path: "/teacher/enrollments",
        badgeKey: "pendingEnrollments",
      },
      { text: he.teacherShares, icon: <ShareIcon />, path: "/teacher/shares" },
      profileMenuItem,
    ];
  }
  return [
    { text: he.dashboard, icon: <DashboardIcon />, path: "/student" },
    {
      text: he.myCourses,
      icon: <MenuBookIcon />,
      path: "/student/courses",
      matchPathPrefix: "/student/courses",
    },
    { text: he.joinByTeacherTitle, icon: <SchoolIcon />, path: "/student/join-course" },
    {
      text: he.exams,
      icon: <QuizIcon />,
      path: "/student/exams",
      matchPathPrefix: "/student/exams",
    },
    { text: he.notifications, icon: <NotificationsIcon />, path: "/student/notifications" },
    profileMenuItem,
  ];
}

export function getHomePath(role: UserRole): string {
  if (role === "admin") return "/admin";
  if (role === "teacher") return "/teacher";
  return "/student";
}

export function roleLabel(role: UserRole): string {
  if (role === "admin") return he.roleAdmin;
  if (role === "teacher") return he.roleTeacher;
  return he.roleStudent;
}

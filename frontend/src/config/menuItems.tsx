import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import QuizIcon from "@mui/icons-material/Quiz";
import NotificationsIcon from "@mui/icons-material/Notifications";
import type { ReactNode } from "react";
import type { UserRole } from "../api/client";
import { he } from "../i18n/he";

export interface MenuItemDef {
  text: string;
  icon: ReactNode;
  path: string;
  matchPathPrefix?: string;
}

export function getMenuItems(role: UserRole): MenuItemDef[] {
  if (role === "admin") {
    return [
      { text: he.dashboard, icon: <DashboardIcon />, path: "/admin" },
      { text: he.adminUsers, icon: <PeopleIcon />, path: "/admin/users" },
      { text: he.students, icon: <SchoolIcon />, path: "/admin/students" },
      { text: he.allCourses, icon: <MenuBookIcon />, path: "/admin/courses" },
    ];
  }
  if (role === "teacher") {
    return [
      { text: he.dashboard, icon: <DashboardIcon />, path: "/teacher" },
      { text: he.students, icon: <PeopleIcon />, path: "/teacher/students" },
      { text: he.catalogCourses, icon: <MenuBookIcon />, path: "/teacher/catalog-courses" },
      { text: he.myCourses, icon: <SchoolIcon />, path: "/teacher/courses" },
      { text: he.exams, icon: <QuizIcon />, path: "/teacher/exams" },
      { text: he.pendingApprovals, icon: <SchoolIcon />, path: "/teacher/enrollments" },
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
    { text: he.openCourses, icon: <SchoolIcon />, path: "/student/open-courses" },
    {
      text: he.exams,
      icon: <QuizIcon />,
      path: "/student/exams",
      matchPathPrefix: "/student/exams",
    },
    { text: he.notifications, icon: <NotificationsIcon />, path: "/student/notifications" },
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

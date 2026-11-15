import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import AutoDeleteOutlinedIcon from "@mui/icons-material/AutoDeleteOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import type { ReactNode } from "react";
import type { UserRole } from "../api/client";
import { he } from "../i18n/he";

export type MenuSection = "main" | "manage" | "account";

export interface MenuItemDef {
  text: string;
  icon: ReactNode;
  path: string;
  matchPathPrefix?: string;
  /** Clé pour badge dynamique (ex. pending enrollments). */
  badgeKey?: "pendingEnrollments";
  /** Groupe dans la barre latérale (défaut : main). */
  section?: MenuSection;
  /** Libellé court de la barre de navigation mobile ; absent = pas dans la barre du bas. */
  mobileLabel?: string;
}

export const PROFILE_PATH = "/profile";
export const CONTACT_PATH = "/contact";

const contactMenuItem: MenuItemDef = {
  text: he.helpAndContact,
  icon: <HelpOutlineIcon />,
  path: CONTACT_PATH,
  section: "account",
};

function adminMenu(): MenuItemDef[] {
  return [
    { text: he.dashboard, icon: <DashboardOutlinedIcon />, path: "/admin", mobileLabel: he.navHome },
    { text: he.adminUsers, icon: <PeopleOutlineIcon />, path: "/admin/users", mobileLabel: he.adminUsers },
    { text: he.students, icon: <SchoolOutlinedIcon />, path: "/admin/students", mobileLabel: he.navStudents },
    { text: he.allCourses, icon: <MenuBookOutlinedIcon />, path: "/admin/courses", mobileLabel: he.navCourses },
    { text: he.aiBillingAdminTitle, icon: <PaidOutlinedIcon />, path: "/admin/ai-billing", section: "manage" },
    { text: he.aiPromptsAdminTitle, icon: <DescriptionOutlinedIcon />, path: "/admin/ai-prompts", section: "manage" },
    { text: he.aiExplanationsAdminTitle, icon: <AutoDeleteOutlinedIcon />, path: "/admin/ai-explanations", section: "manage" },
    contactMenuItem,
  ];
}

function teacherMenu(): MenuItemDef[] {
  return [
    { text: he.dashboard, icon: <DashboardOutlinedIcon />, path: "/teacher", mobileLabel: he.navHome },
    { text: he.myCourses, icon: <SchoolOutlinedIcon />, path: "/teacher/courses", mobileLabel: he.navCourses },
    { text: he.exams, icon: <AssignmentOutlinedIcon />, path: "/teacher/exams", mobileLabel: he.navExams },
    { text: he.students, icon: <PeopleOutlineIcon />, path: "/teacher/students", mobileLabel: he.navStudents },
    {
      text: he.pendingApprovals,
      icon: <HowToRegOutlinedIcon />,
      path: "/teacher/enrollments",
      badgeKey: "pendingEnrollments",
      section: "manage",
    },
    { text: he.catalogCourses, icon: <MenuBookOutlinedIcon />, path: "/teacher/catalog-courses", section: "manage" },
    { text: he.teacherShares, icon: <ShareOutlinedIcon />, path: "/teacher/shares", section: "manage" },
    contactMenuItem,
  ];
}

function studentMenu(): MenuItemDef[] {
  return [
    { text: he.dashboard, icon: <DashboardOutlinedIcon />, path: "/student", mobileLabel: he.navHome },
    {
      text: he.myCourses,
      icon: <MenuBookOutlinedIcon />,
      path: "/student/courses",
      matchPathPrefix: "/student/courses",
      mobileLabel: he.navCourses,
    },
    {
      text: he.exams,
      icon: <AssignmentOutlinedIcon />,
      path: "/student/exams",
      matchPathPrefix: "/student/exams",
      mobileLabel: he.navExams,
    },
    { text: he.joinByTeacherTitle, icon: <PersonAddAltOutlinedIcon />, path: "/student/join-course", section: "manage" },
    { text: he.studentShares, icon: <ShareOutlinedIcon />, path: "/student/shares", section: "manage" },
    contactMenuItem,
  ];
}

export function getMenuItems(role: UserRole): MenuItemDef[] {
  if (role === "admin") return adminMenu();
  if (role === "teacher") return teacherMenu();
  return studentMenu();
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

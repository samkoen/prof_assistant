import type { ReactNode } from "react";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import type { UserRole } from "../api/client";
import { he } from "../i18n/he";

export type CreateAction = { label: string; hint: string; icon: ReactNode; to: string };

/** Paramètre d'URL qui ouvre directement le dialogue de création d'une page de liste. */
export const OPEN_CREATE_PARAM = "new";

/** Raccourcis du bouton « יצירה » de la barre supérieure, par rôle. */
export function getCreateActions(role: UserRole | undefined): CreateAction[] {
  if (role !== "teacher") return [];
  return [
    { label: he.createMenuExam, hint: he.createMenuExamHint, icon: <AssignmentOutlinedIcon />, to: "/teacher/exams/new" },
    { label: he.createMenuCourse, hint: he.createMenuCourseHint, icon: <SchoolOutlinedIcon />, to: `/teacher/courses?${OPEN_CREATE_PARAM}=1` },
    { label: he.createMenuSubject, hint: he.createMenuSubjectHint, icon: <MenuBookOutlinedIcon />, to: `/teacher/catalog-courses?${OPEN_CREATE_PARAM}=1` },
  ];
}

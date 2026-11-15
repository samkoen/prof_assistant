import type { ReactNode } from "react";
import AppPageHeader from "./ui/AppPageHeader";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

/** Alias historique de l'en-tête de page unifié. */
export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return <AppPageHeader title={title} subtitle={subtitle} actions={action} />;
}

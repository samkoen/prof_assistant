import type { ReactNode } from "react";
import AppPageHeader from "./AppPageHeader";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

/** Alias historique de l'en-tête de page unifié. */
export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return <AppPageHeader title={title} subtitle={subtitle} actions={actions} />;
}

import type { ReactNode } from "react";
import AppPageHeader from "./AppPageHeader";

type PageHeroBannerProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

/** Ancienne bannière colorée : remplacée par l'en-tête de page sobre. */
export default function PageHeroBanner({ title, subtitle, actions }: PageHeroBannerProps) {
  return <AppPageHeader title={title} subtitle={subtitle} actions={actions} />;
}

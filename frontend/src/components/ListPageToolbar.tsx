import type { ReactNode } from "react";
import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AppPageHeader from "./ui/AppPageHeader";

interface ListPageToolbarProps {
  title: ReactNode;
  subtitle?: string;
  addLabel?: string;
  onAdd?: () => void;
  /** Actions personnalisées (remplace addLabel/onAdd si fourni). */
  actions?: ReactNode;
  titleVariant?: "h4" | "h5";
  back?: { to: string; label: string };
  meta?: ReactNode;
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="contained" startIcon={<AddIcon />} onClick={onClick}>
      {label}
    </Button>
  );
}

/** En-tête des pages de liste : titre, sous-titre et action principale « ajouter ». */
export default function ListPageToolbar({ title, subtitle, addLabel, onAdd, actions, titleVariant = "h4", back, meta }: ListPageToolbarProps) {
  const resolved = actions ?? (addLabel && onAdd ? <AddButton label={addLabel} onClick={onAdd} /> : undefined);
  return (
    <AppPageHeader
      title={title}
      subtitle={subtitle}
      actions={resolved}
      back={back}
      meta={meta}
      size={titleVariant === "h5" ? "medium" : "large"}
    />
  );
}

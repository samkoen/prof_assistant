import { InputBase } from "@mui/material";
import { he } from "../../i18n/he";

type InlineExamTitleProps = {
  value: string;
  editable: boolean;
  saving: boolean;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
};

/** Titre éditable en place : Entrée ou perte du focus enregistre, Échap annule. */
export default function InlineExamTitle({ value, editable, saving, onChange, onCommit, onCancel }: InlineExamTitleProps) {
  return (
    <InputBase
      value={value}
      readOnly={!editable || saving}
      placeholder={he.newExamDefaultTitle}
      title={editable ? he.examTitleInlineHint : undefined}
      inputProps={{ maxLength: 255, "aria-label": he.examTitle, dir: "auto" }}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onCommit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") onCancel();
      }}
      sx={{
        width: "100%",
        font: "inherit",
        color: "inherit",
        // dir="auto" garde un titre anglais lisible, mais l'alignement suit la page (RTL).
        "& input": { p: 0, textOverflow: "ellipsis", textAlign: "right" },
        borderRadius: 1,
        px: 0.5,
        mx: -0.5,
        ...(editable && { "&:hover, &.Mui-focused": { bgcolor: "action.hover" } }),
      }}
    />
  );
}

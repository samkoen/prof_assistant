import { Box, Checkbox, Radio } from "@mui/material";
import { OptionText } from "../../MultilineOptionLayout";
import { brand } from "../../../theme/brand";
import type { StudentQuestion } from "../../../api/client";

type ExamOptionRowProps = {
  option: StudentQuestion["options"][number];
  questionText: string;
  multiple: boolean;
  checked: boolean;
  ltr: boolean;
  onChange: (checked: boolean) => void;
};

function rowSx(checked: boolean, ltr: boolean) {
  return {
    display: "flex",
    alignItems: "flex-start",
    gap: 0.5,
    mb: 1,
    px: 1,
    py: 0.75,
    cursor: "pointer",
    borderRadius: 2,
    border: "1.5px solid",
    borderColor: checked ? brand.violet600 : "divider",
    bgcolor: checked ? brand.violet50 : "background.paper",
    transition: "border-color .15s, background-color .15s",
    textAlign: ltr ? "left" : "right",
    "&:hover": { borderColor: brand.violet500, bgcolor: checked ? brand.violet50 : "action.hover" },
  } as const;
}

/** Une réponse sélectionnable : toute la ligne est cliquable et change d'aspect une fois choisie. */
export default function ExamOptionRow({ option, questionText, multiple, checked, ltr, onChange }: ExamOptionRowProps) {
  const Control = multiple ? Checkbox : Radio;
  return (
    <Box component="label" sx={rowSx(checked, ltr)}>
      <Box sx={{ direction: "ltr", display: "inline-flex", flexShrink: 0 }}>
        <Control checked={checked} onChange={(e) => onChange(e.target.checked)} sx={{ p: 0.5 }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>
        <OptionText text={option.text} imageUrl={option.image_url} questionText={questionText} />
      </Box>
    </Box>
  );
}

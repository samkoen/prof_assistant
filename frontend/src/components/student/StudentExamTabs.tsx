import { Tab, Tabs } from "@mui/material";
import { he } from "../../i18n/he";

export type StudentExamsTab = "pending" | "done";

type StudentExamTabsProps = {
  value: StudentExamsTab;
  pendingCount: number;
  doneCount: number;
  onChange: (value: StudentExamsTab) => void;
};

/** Onglets « à faire » / « terminés » avec leurs effectifs. */
export default function StudentExamTabs({ value, pendingCount, doneCount, onChange }: StudentExamTabsProps) {
  return (
    <Tabs value={value} onChange={(_, v: StudentExamsTab) => onChange(v)} dir="rtl" sx={{ mb: 2.5, borderBottom: 1, borderColor: "divider" }}>
      <Tab value="pending" label={`${he.studentExamsTabPending} (${pendingCount})`} />
      <Tab value="done" label={`${he.studentExamsTabDone} (${doneCount})`} />
    </Tabs>
  );
}

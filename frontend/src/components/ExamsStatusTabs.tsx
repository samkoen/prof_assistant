import { Tab, Tabs } from "@mui/material";
import { he } from "../i18n/he";

export type ExamsStatusTab = "open" | "closed";

type ExamsStatusTabsProps = {
  value: ExamsStatusTab;
  onChange: (value: ExamsStatusTab) => void;
  openCount: number;
  closedCount: number;
};

export default function ExamsStatusTabs({
  value,
  onChange,
  openCount,
  closedCount,
}: ExamsStatusTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, next) => onChange(next as ExamsStatusTab)}
      variant="fullWidth"
      dir="rtl"
      sx={{ mb: 2, borderBottom: 1, borderColor: "divider", direction: "rtl" }}
    >
      <Tab value="open" label={`${he.examsTabOpen} (${openCount})`} />
      <Tab value="closed" label={`${he.examsTabClosed} (${closedCount})`} />
    </Tabs>
  );
}

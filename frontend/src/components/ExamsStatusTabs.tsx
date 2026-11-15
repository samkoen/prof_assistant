import { Box, Tab, Tabs } from "@mui/material";
import { he } from "../i18n/he";
import { brand, surface } from "../theme/brand";

export type ExamsStatusTab = "open" | "closed";

type ExamsStatusTabsProps = {
  value: ExamsStatusTab;
  onChange: (value: ExamsStatusTab) => void;
  openCount: number;
  closedCount: number;
};

function TabLabel({ text, count, selected }: { text: string; count: number; selected: boolean }) {
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      {text}
      <Box
        component="span"
        sx={{ minWidth: 22, px: 0.75, borderRadius: 999, fontSize: "0.75rem", lineHeight: "20px", bgcolor: selected ? brand.primary100 : surface.hover, color: selected ? brand.primary700 : brand.slate600 }}
      >
        {count}
      </Box>
    </Box>
  );
}

/** Onglets « פעילות וטיוטות » / « סגורות » avec compteurs. */
export default function ExamsStatusTabs({ value, onChange, openCount, closedCount }: ExamsStatusTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, next) => onChange(next as ExamsStatusTab)}
      variant="scrollable"
      allowScrollButtonsMobile
      sx={{ mb: 2.5, borderBottom: 1, borderColor: "divider" }}
    >
      <Tab value="open" label={<TabLabel text={he.examsTabOpen} count={openCount} selected={value === "open"} />} />
      <Tab value="closed" label={<TabLabel text={he.examsTabClosed} count={closedCount} selected={value === "closed"} />} />
    </Tabs>
  );
}

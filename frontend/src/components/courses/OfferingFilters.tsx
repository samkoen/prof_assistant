import { Box, Chip, InputAdornment, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { he } from "../../i18n/he";
import { statusTones } from "../../theme/brand";
import type { SemesterFilter } from "../../utils/offeringsList";

type OfferingFiltersProps = {
  query: string;
  semester: SemesterFilter;
  onQueryChange: (value: string) => void;
  onSemesterChange: (value: SemesterFilter) => void;
};

const OPTIONS: Array<{ value: SemesterFilter; label: string }> = [
  { value: "all", label: he.coursesAllSemesters },
  { value: "1", label: "סמסטר א" },
  { value: "2", label: "סמסטר ב" },
];

function SemesterChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  const tone = statusTones.violet;
  const sx = selected
    ? { bgcolor: tone.fg, color: "#fff", fontWeight: 700, "&:hover": { bgcolor: tone.fg } }
    : { bgcolor: tone.bg, color: tone.fg, fontWeight: 600 };
  return <Chip clickable onClick={onClick} label={label} aria-pressed={selected} sx={sx} />;
}

/** Recherche texte + filtre par semestre pour la liste des groupes. */
export default function OfferingFilters({ query, semester, onQueryChange, onSemesterChange }: OfferingFiltersProps) {
  return (
    <Box dir="rtl" sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, mb: 2.5 }}>
      <TextField
        size="small"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={he.coursesSearchPlaceholder}
        inputProps={{ "aria-label": he.coursesSearchPlaceholder }}
        sx={{ flex: "1 1 260px", minWidth: 220, maxWidth: 420 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
      />
      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
        {OPTIONS.map((o) => (
          <SemesterChip key={o.value} label={o.label} selected={semester === o.value} onClick={() => onSemesterChange(o.value)} />
        ))}
      </Box>
    </Box>
  );
}

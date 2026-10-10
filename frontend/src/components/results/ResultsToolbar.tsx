import { Box, Chip, InputAdornment, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { he } from "../../i18n/he";
import { statusTones } from "../../theme/brand";
import type { ResultsStats, ResultsStatusFilter } from "../../utils/resultsStats";

type ResultsToolbarProps = {
  query: string;
  status: ResultsStatusFilter;
  stats: ResultsStats;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: ResultsStatusFilter) => void;
};

function filterOptions(stats: ResultsStats): Array<{ value: ResultsStatusFilter; label: string; count: number }> {
  return [
    { value: "all", label: he.resultsFilterAll, count: stats.total },
    { value: "submitted", label: he.resultSubmitted, count: stats.submitted },
    { value: "in_progress", label: he.resultInProgress, count: stats.inProgress },
    { value: "not_started", label: he.resultNotStarted, count: stats.notStarted },
  ];
}

function StatusFilterChip({ label, count, selected, onClick }: { label: string; count: number; selected: boolean; onClick: () => void }) {
  const tone = statusTones.violet;
  return (
    <Chip
      clickable
      onClick={onClick}
      label={`${label} (${count})`}
      aria-pressed={selected}
      sx={selected ? { bgcolor: tone.fg, color: "#fff", fontWeight: 700, "&:hover": { bgcolor: tone.fg } } : { bgcolor: tone.bg, color: tone.fg, fontWeight: 600 }}
    />
  );
}

/** Recherche (nom / numéro) et filtre par statut avec compteurs. */
export default function ResultsToolbar({ query, status, stats, onQueryChange, onStatusChange }: ResultsToolbarProps) {
  return (
    <Box dir="rtl" sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, mb: 2 }}>
      <TextField
        size="small"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={he.resultsSearchPlaceholder}
        inputProps={{ "aria-label": he.resultsSearchPlaceholder }}
        sx={{ flex: "1 1 260px", minWidth: 220 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
      />
      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
        {filterOptions(stats).map((o) => (
          <StatusFilterChip key={o.value} label={o.label} count={o.count} selected={status === o.value} onClick={() => onStatusChange(o.value)} />
        ))}
      </Box>
    </Box>
  );
}

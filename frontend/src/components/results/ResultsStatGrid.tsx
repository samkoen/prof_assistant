import { Grid } from "@mui/material";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import StatCard from "../ui/StatCard";
import { he } from "../../i18n/he";
import { formatPercent, scoreTone, type ResultsStats } from "../../utils/resultsStats";

/** Quatre chiffres clés de la session : participation, moyenne, meilleure et plus basse note. */
export default function ResultsStatGrid({ stats }: { stats: ResultsStats }) {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard label={he.resultsStatSubmitted} value={`${stats.submitted} / ${stats.total}`} icon={<AssignmentTurnedInOutlinedIcon />} tone="violet" />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard label={he.resultsStatAverage} value={formatPercent(stats.average)} icon={<QueryStatsIcon />} tone={scoreTone(stats.average)} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard label={he.resultsStatHighest} value={formatPercent(stats.highest)} icon={<EmojiEventsOutlinedIcon />} tone="success" />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard label={he.resultsStatLowest} value={formatPercent(stats.lowest)} icon={<TrendingDownIcon />} tone={stats.lowest == null ? "neutral" : scoreTone(stats.lowest)} />
      </Grid>
    </Grid>
  );
}

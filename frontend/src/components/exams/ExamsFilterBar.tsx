import { Box, Button, InputAdornment, MenuItem, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { he } from "../../i18n/he";
import { hasActiveFilters, NO_FILTERS, type ExamFilters } from "../../utils/examFilters";

type ExamsFilterBarProps = {
  filters: ExamFilters;
  catalogs: string[];
  onChange: (next: ExamFilters) => void;
};

function SearchField({ filters, onChange }: Pick<ExamsFilterBarProps, "filters" | "onChange">) {
  return (
    <TextField
      size="small"
      value={filters.query}
      onChange={(e) => onChange({ ...filters, query: e.target.value })}
      placeholder={he.examsSearchPlaceholder}
      inputProps={{ "aria-label": he.examsSearchPlaceholder, dir: "rtl" }}
      sx={{ flex: "1 1 280px", minWidth: 220 }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
      }}
    />
  );
}

function CatalogSelect({ filters, catalogs, onChange }: ExamsFilterBarProps) {
  return (
    <TextField
      select
      size="small"
      value={filters.catalogName}
      onChange={(e) => onChange({ ...filters, catalogName: e.target.value })}
      sx={{ flex: "0 1 240px", minWidth: 180 }}
      SelectProps={{ displayEmpty: true }}
      inputProps={{ "aria-label": he.catalogCourses }}
    >
      <MenuItem value="">{he.examsAllCatalogs}</MenuItem>
      {catalogs.map((name) => (
        <MenuItem key={name} value={name}>
          {name}
        </MenuItem>
      ))}
    </TextField>
  );
}

/** Recherche texte + filtre par cours : retrouver un examen en quelques secondes. */
export default function ExamsFilterBar(props: ExamsFilterBarProps) {
  const active = hasActiveFilters(props.filters);
  return (
    <Box dir="rtl" sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, mb: 2 }}>
      <SearchField filters={props.filters} onChange={props.onChange} />
      <CatalogSelect {...props} />
      {active && (
        <Button size="small" onClick={() => props.onChange(NO_FILTERS)}>
          {he.examsFilterClear}
        </Button>
      )}
    </Box>
  );
}

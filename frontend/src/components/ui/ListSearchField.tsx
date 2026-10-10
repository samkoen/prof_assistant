import { InputAdornment, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

type ListSearchFieldProps = {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  maxWidth?: number;
};

/** Champ de recherche standard des listes (icône loupe, RTL). */
export default function ListSearchField({ value, placeholder, onChange, maxWidth = 420 }: ListSearchFieldProps) {
  return (
    <TextField
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputProps={{ "aria-label": placeholder, dir: "rtl" }}
      sx={{ flex: "1 1 260px", minWidth: 220, maxWidth }}
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

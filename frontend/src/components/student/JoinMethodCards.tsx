import type { FormEvent } from "react";
import { alpha, Box, Button, Paper, TextField, Typography } from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import SearchIcon from "@mui/icons-material/Search";
import { he } from "../../i18n/he";
import { brand, softCardShadow } from "../../theme/brand";

type JoinMethodCardsProps = {
  email: string;
  searching: boolean;
  onEmailChange: (value: string) => void;
  onSearch: () => void;
  onScan: () => void;
};

const cardSx = { flex: "1 1 320px", p: 3, borderRadius: 3, boxShadow: softCardShadow, display: "flex", flexDirection: "column", gap: 1.5 } as const;

function MethodHeader({ icon, title, description }: { icon: JSX.Element; title: string; description: string }) {
  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
      <Box sx={{ width: 44, height: 44, borderRadius: 2.5, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: alpha(brand.violet600, 0.1), color: brand.violet600, flexShrink: 0 }}>
        {icon}
      </Box>
      <Box>
        <Typography fontWeight={800}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
    </Box>
  );
}

/** Deux façons de rejoindre un cours : scan du QR du prof, ou recherche par e-mail du prof. */
export default function JoinMethodCards({ email, searching, onEmailChange, onSearch, onScan }: JoinMethodCardsProps) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSearch();
  };
  return (
    <Box dir="rtl" sx={{ display: "flex", gap: 2.5, flexWrap: "wrap" }}>
      <Paper sx={cardSx}>
        <MethodHeader icon={<QrCodeScannerIcon />} title={he.studentJoinScanTitle} description={he.studentJoinScanDesc} />
        <Button variant="contained" startIcon={<QrCodeScannerIcon />} onClick={onScan} sx={{ mt: "auto", alignSelf: "flex-start" }}>
          {he.scanJoinQr}
        </Button>
      </Paper>
      <Paper component="form" onSubmit={submit} sx={cardSx}>
        <MethodHeader icon={<SearchIcon />} title={he.studentJoinEmailTitle} description={he.studentJoinEmailDesc} />
        <TextField label={he.teacherEmail} type="email" value={email} onChange={(e) => onEmailChange(e.target.value)} required fullWidth dir="ltr" placeholder="teacher@example.com" size="small" />
        <Button type="submit" variant="contained" disabled={searching || !email.trim()} sx={{ alignSelf: "flex-start" }}>
          {searching ? he.loading : he.searchTeacherCourses}
        </Button>
      </Paper>
    </Box>
  );
}

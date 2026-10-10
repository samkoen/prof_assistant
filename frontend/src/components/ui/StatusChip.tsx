import { Box } from "@mui/material";
import { statusTones, type StatusTone } from "../../theme/brand";

type StatusChipProps = {
  label: string;
  tone: StatusTone;
};

/** Pastille d'état : point coloré + libellé, lisible d'un coup d'œil. */
export default function StatusChip({ label, tone }: StatusChipProps) {
  const color = statusTones[tone];
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.25,
        py: 0.4,
        borderRadius: 999,
        bgcolor: color.bg,
        color: color.fg,
        fontSize: "0.78rem",
        fontWeight: 700,
        lineHeight: 1.4,
        whiteSpace: "nowrap",
      }}
    >
      <Box component="span" aria-hidden sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: color.fg }} />
      {label}
    </Box>
  );
}

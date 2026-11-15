import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Box, Card, CardActionArea, Skeleton, Typography } from "@mui/material";
import { brand, softCardShadow, statusTones, type StatusTone } from "../../theme/brand";

type StatCardProps = {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone: StatusTone;
  /** Sans 	o, la carte est purement informative. */
  to?: string;
  hint?: string;
  loading?: boolean;
};

function IconBadge({ icon, tone }: { icon: ReactNode; tone: StatusTone }) {
  const color = statusTones[tone];
  return (
    <Box
      sx={{
        width: 40,
        height: 40,
        flexShrink: 0,
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: color.bg,
        color: color.fg,
        "& .MuiSvgIcon-root": { fontSize: 22 },
      }}
    >
      {icon}
    </Box>
  );
}

function StatValue({ value, loading }: { value: string | number; loading?: boolean }) {
  if (loading) return <Skeleton variant="text" width={56} height={44} />;
  return (
    <Typography variant="h5" component="p" fontWeight={700} sx={{ lineHeight: 1.15, color: brand.slate900, fontSize: { xs: "1.3rem", sm: "1.5rem" } }}>
      {value}
    </Typography>
  );
}

const cardSx = {
  height: "100%",
  boxShadow: softCardShadow,
  transition: "border-color 0.15s ease",
  "&:hover": { borderColor: brand.primary400 },
} as const;

type StatBodyProps = Omit<StatCardProps, "to">;

function StatBody({ label, value, icon, tone, hint, loading }: StatBodyProps) {
  return (
    <>
      <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: { xs: 1, sm: 1.5 } }}>
        <IconBadge icon={icon} tone={tone} />
        <Box sx={{ minWidth: 0 }}>
          <StatValue value={value} loading={loading} />
          <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
            {label}
          </Typography>
        </Box>
      </Box>
      {hint && !loading && (
        <Typography variant="caption" fontWeight={700} sx={{ display: "block", mt: 1.25, color: statusTones[tone].fg }}>
          {hint}
        </Typography>
      )}
    </>
  );
}

/** Chiffre clé : cliquable (mène à l'écran d'action) quand `to` est fourni, sinon informatif. */
export default function StatCard({ to, ...body }: StatCardProps) {
  if (!to) {
    return (
      <Card sx={{ ...cardSx, p: { xs: 1.75, sm: 2.25 }, "&:hover": {} }}>
        <StatBody {...body} />
      </Card>
    );
  }
  return (
    <Card sx={cardSx}>
      <CardActionArea component={Link} to={to} sx={{ p: { xs: 1.75, sm: 2.25 }, height: "100%" }}>
        <StatBody {...body} />
      </CardActionArea>
    </Card>
  );
}

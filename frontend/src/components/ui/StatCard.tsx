import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { alpha, Box, Card, CardActionArea, Skeleton, Typography } from "@mui/material";
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
        width: 46,
        height: 46,
        flexShrink: 0,
        borderRadius: 2.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: color.bg,
        color: color.fg,
        "& .MuiSvgIcon-root": { fontSize: 26 },
      }}
    >
      {icon}
    </Box>
  );
}

function StatValue({ value, loading }: { value: string | number; loading?: boolean }) {
  if (loading) return <Skeleton variant="text" width={56} height={44} />;
  return (
    <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.1, color: brand.slate900 }}>
      {value}
    </Typography>
  );
}

const cardSx = {
  height: "100%",
  boxShadow: softCardShadow,
  transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
  "&:hover": {
    transform: "translateY(-3px)",
    borderColor: alpha(brand.violet600, 0.35),
    boxShadow: `0 14px 34px ${alpha(brand.violet900, 0.14)}`,
  },
} as const;

type StatBodyProps = Omit<StatCardProps, "to">;

function StatBody({ label, value, icon, tone, hint, loading }: StatBodyProps) {
  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
        <IconBadge icon={icon} tone={tone} />
        <Box sx={{ minWidth: 0 }}>
          <StatValue value={value} loading={loading} />
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
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
      <Card sx={{ ...cardSx, p: 2.25, "&:hover": {} }}>
        <StatBody {...body} />
      </Card>
    );
  }
  return (
    <Card sx={cardSx}>
      <CardActionArea component={Link} to={to} sx={{ p: 2.25, height: "100%" }}>
        <StatBody {...body} />
      </CardActionArea>
    </Card>
  );
}

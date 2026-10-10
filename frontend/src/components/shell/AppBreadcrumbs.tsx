import { Link as RouterLink } from "react-router-dom";
import { Breadcrumbs, Link, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import type { Crumb } from "../../utils/pageCrumbs";
import { he } from "../../i18n/he";
import { brand } from "../../theme/brand";

function CrumbItem({ crumb }: { crumb: Crumb }) {
  if (!crumb.path) {
    return (
      <Typography variant="body2" fontWeight={700} color={brand.slate900} noWrap aria-current="page">
        {crumb.label}
      </Typography>
    );
  }
  return (
    <Link
      component={RouterLink}
      to={crumb.path}
      underline="hover"
      variant="body2"
      fontWeight={500}
      color={brand.slate600}
      noWrap
    >
      {crumb.label}
    </Link>
  );
}

/** Fil d'Ariane : où je suis, et retour en un clic aux niveaux supérieurs. */
export default function AppBreadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <Breadcrumbs
      aria-label={he.breadcrumbsLabel}
      separator={<ChevronLeftIcon sx={{ fontSize: 18, color: brand.slate400 }} />}
      sx={{ minWidth: 0, "& .MuiBreadcrumbs-ol": { flexWrap: "nowrap" } }}
    >
      {crumbs.map((crumb) => (
        <CrumbItem key={`${crumb.label}-${crumb.path ?? "current"}`} crumb={crumb} />
      ))}
    </Breadcrumbs>
  );
}

import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { alpha, Avatar, Box, Card, CardActionArea, Chip, Divider, Grid2 as Grid, Typography } from "@mui/material";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import StatusChip from "../ui/StatusChip";
import type { CatalogCourse, CourseOffering } from "../../api/client";
import { semesterLabel } from "../../api/client";
import { courseCardColor } from "../../constants/courseCardColors";
import { he } from "../../i18n/he";
import { brand, softCardShadow } from "../../theme/brand";
import { offeringTeacherNames } from "../../utils/offeringTeachers";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return iso;
  }
}

type CardShellProps = {
  accent: string;
  link?: string;
  interactive?: boolean;
  onDoubleClick?: () => void;
  minHeight: number;
  children: ReactNode;
  footer?: ReactNode;
};

/** Carte de base : bande d'accent en haut, ombre douce, relief au survol si cliquable. */
function CardShell({ accent, link, interactive, onDoubleClick, minHeight, children, footer }: CardShellProps) {
  const hoverable = Boolean(link || interactive);
  const card = (
    <Card
      elevation={0}
      onDoubleClick={onDoubleClick}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderTop: `4px solid ${accent}`,
        boxShadow: softCardShadow,
        cursor: onDoubleClick ? "pointer" : undefined,
        transition: "box-shadow 0.2s, transform 0.15s",
        "&:hover": hoverable ? { boxShadow: `0 12px 30px ${alpha(brand.violet900, 0.14)}`, transform: "translateY(-2px)" } : undefined,
      }}
    >
      <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 1.5, minHeight, flex: 1 }}>{children}</Box>
      {footer && (
        <>
          <Divider />
          <Box sx={{ p: 1, display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>{footer}</Box>
        </>
      )}
    </Card>
  );
  if (!link) return card;
  return (
    <CardActionArea component={RouterLink} to={link} sx={{ borderRadius: 3, height: "100%" }}>
      {card}
    </CardActionArea>
  );
}

function CourseAvatar({ name, accent }: { name: string; accent: string }) {
  return (
    <Avatar sx={{ width: 48, height: 48, bgcolor: alpha(accent, 0.14), color: accent, fontWeight: 800, fontSize: "1.15rem", flexShrink: 0 }}>
      {name.trim()[0]?.toUpperCase() ?? "?"}
    </Avatar>
  );
}

function OfferingStatus({ offering }: { offering: CourseOffering }) {
  if (offering.enrollment_status) {
    const approved = offering.enrollment_status === "approved";
    const label = approved ? he.enrollmentApprovedStatus : he.enrollmentPendingApproval;
    return <StatusChip label={label} tone={approved ? "success" : "warning"} />;
  }
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        {he.enrollment}:
      </Typography>
      <StatusChip label={offering.is_open_enrollment ? he.open : he.closed} tone={offering.is_open_enrollment ? "success" : "neutral"} />
    </Box>
  );
}

function OfferingHeader({ offering, accent, actions }: { offering: CourseOffering; accent: string; actions?: ReactNode }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
      <CourseAvatar name={offering.catalog_name} accent={accent} />
      <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
        <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.35 }}>
          {offering.catalog_name}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
          {offering.group_name} · {offering.academic_year} · {semesterLabel(offering.semester)}
        </Typography>
      </Box>
      {actions && (
        <Box sx={{ display: "flex", gap: 0.25, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
          {actions}
        </Box>
      )}
    </Box>
  );
}

function ClampedText({ text }: { text: string }) {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
      {text}
    </Typography>
  );
}

export interface OfferingCardGridProps {
  offerings: CourseOffering[];
  emptyMessage?: string;
  getCardLink?: (offering: CourseOffering) => string | undefined;
  onCardDoubleClick?: (offering: CourseOffering) => void;
  /** Icônes d'action dans l'en-tête de la carte. */
  renderActions?: (offering: CourseOffering) => ReactNode;
  /** Pied de carte (boutons étiquetés), séparé du contenu par un filet. */
  renderFooter?: (offering: CourseOffering) => ReactNode;
  /** Indication ajoutée sous l'état d'inscription (ex. demandes en attente). */
  renderBadge?: (offering: CourseOffering) => ReactNode;
}

function OfferingCard({ offering, index, props }: { offering: CourseOffering; index: number; props: OfferingCardGridProps }) {
  const { accent } = courseCardColor(index);
  const { getCardLink, onCardDoubleClick, renderActions, renderFooter, renderBadge } = props;
  return (
    <CardShell
      accent={accent}
      link={getCardLink?.(offering)}
      interactive={Boolean(onCardDoubleClick)}
      onDoubleClick={onCardDoubleClick ? () => onCardDoubleClick(offering) : undefined}
      minHeight={150}
      footer={renderFooter?.(offering)}
    >
      <OfferingHeader offering={offering} accent={accent} actions={renderActions?.(offering)} />
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <OfferingStatus offering={offering} />
        {renderBadge?.(offering)}
      </Box>
      {offering.description ? <ClampedText text={offering.description} /> : null}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "text.secondary", mt: "auto" }}>
        <MenuBookOutlinedIcon sx={{ fontSize: 18, opacity: 0.7 }} />
        <Typography variant="caption">{offeringTeacherNames(offering)}</Typography>
      </Box>
    </CardShell>
  );
}

function EmptyGrid({ message }: { message: string }) {
  return (
    <Typography color="text.secondary" textAlign="center" py={6}>
      {message}
    </Typography>
  );
}

export function OfferingCardGrid(props: OfferingCardGridProps) {
  const { offerings, emptyMessage = he.noCourses } = props;
  if (offerings.length === 0) return <EmptyGrid message={emptyMessage} />;
  return (
    <Grid container spacing={2.5}>
      {offerings.map((offering, index) => (
        <Grid key={offering.id} size={{ xs: 12, sm: 6, lg: 4 }}>
          <OfferingCard offering={offering} index={index} props={props} />
        </Grid>
      ))}
    </Grid>
  );
}

export interface CatalogCardGridProps {
  catalogs: CatalogCourse[];
  emptyMessage?: string;
  getCardLink?: (catalog: CatalogCourse) => string | undefined;
  /** Icônes d'action dans l'en-tête de la carte. */
  renderActions?: (catalog: CatalogCourse) => ReactNode;
  /** Pied de carte (ex. bouton de partage). */
  renderFooter?: (catalog: CatalogCourse) => ReactNode;
}

type CatalogCardProps = {
  catalog: CatalogCourse;
  index: number;
  link?: string;
  footer?: ReactNode;
  actions?: ReactNode;
};

function CatalogHeader({ catalog, accent, actions }: { catalog: CatalogCourse; accent: string; actions?: ReactNode }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
      <CourseAvatar name={catalog.name} accent={accent} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" fontWeight={800}>{catalog.name}</Typography>
        <Typography variant="caption" color="text.secondary">{formatDate(catalog.created_at)}</Typography>
      </Box>
      {actions}
    </Box>
  );
}

function CatalogCard({ catalog, index, link, footer, actions }: CatalogCardProps) {
  const { accent } = courseCardColor(index);
  return (
    <CardShell accent={accent} link={link} minHeight={130} footer={footer}>
      <CatalogHeader catalog={catalog} accent={accent} actions={actions} />
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Chip size="small" label={`${he.exams}: ${catalog.exam_count}`} />
        <Chip size="small" label={`תרגילים: ${catalog.exercise_count}`} variant="outlined" />
      </Box>
      {catalog.description && <ClampedText text={catalog.description} />}
    </CardShell>
  );
}

export function CatalogCardGrid({ catalogs, emptyMessage = he.noCatalogCourses, getCardLink, renderActions, renderFooter }: CatalogCardGridProps) {
  if (catalogs.length === 0) return <EmptyGrid message={emptyMessage} />;
  return (
    <Grid container spacing={2.5}>
      {catalogs.map((catalog, index) => (
        <Grid key={catalog.id} size={{ xs: 12, sm: 6, lg: 4 }}>
          <CatalogCard
            catalog={catalog}
            index={index}
            link={getCardLink?.(catalog)}
            actions={renderActions?.(catalog)}
            footer={renderFooter?.(catalog)}
          />
        </Grid>
      ))}
    </Grid>
  );
}

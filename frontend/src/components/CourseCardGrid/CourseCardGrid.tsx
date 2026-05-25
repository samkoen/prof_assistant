import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  Chip,
  Grid2 as Grid,
  Typography,
} from "@mui/material";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import type { CatalogCourse, CourseOffering } from "../../api/client";
import { semesterLabel } from "../../api/client";
import { courseCardColor } from "../../constants/courseCardColors";
import { he } from "../../i18n/he";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export interface OfferingCardGridProps {
  offerings: CourseOffering[];
  emptyMessage?: string;
  getCardLink?: (offering: CourseOffering) => string | undefined;
  onCardDoubleClick?: (offering: CourseOffering) => void;
  renderActions?: (offering: CourseOffering) => ReactNode;
}

export function OfferingCardGrid({
  offerings,
  emptyMessage = he.noCourses,
  getCardLink,
  onCardDoubleClick,
  renderActions,
}: OfferingCardGridProps) {
  if (offerings.length === 0) {
    return (
      <Typography color="text.secondary" textAlign="center" py={6}>
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <Grid container spacing={2.5}>
      {offerings.map((offering, index) => {
        const { bg, accent } = courseCardColor(index);
        const link = getCardLink?.(offering);
        const inner = (
          <Card
            elevation={0}
            sx={{
              height: "100%",
              bgcolor: bg,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "rgba(0,0,0,0.06)",
              transition: "box-shadow 0.2s, transform 0.15s",
              "&:hover":
                link || onCardDoubleClick ? { boxShadow: 3, transform: "translateY(-2px)" } : undefined,
              cursor: onCardDoubleClick ? "pointer" : undefined,
            }}
            onDoubleClick={onCardDoubleClick ? () => onCardDoubleClick(offering) : undefined}
          >
            <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 1.5, minHeight: 168 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: accent,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    flexShrink: 0,
                  }}
                >
                  {offering.catalog_name.trim()[0]?.toUpperCase() ?? "?"}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.35 }}>
                    {offering.catalog_name.toUpperCase()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    {offering.group_name} · {offering.academic_year} · {semesterLabel(offering.semester)}
                  </Typography>
                </Box>
                {renderActions && (
                  <Box sx={{ display: "flex", gap: 0.25, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    {renderActions(offering)}
                  </Box>
                )}
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                {offering.enrollment_status ? (
                  <Chip
                    size="small"
                    color={offering.enrollment_status === "approved" ? "success" : "warning"}
                    label={
                      offering.enrollment_status === "approved"
                        ? he.enrollmentApprovedStatus
                        : he.enrollmentPendingApproval
                    }
                    sx={{ height: 22, fontSize: "0.75rem", fontWeight: 600 }}
                  />
                ) : (
                  <>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {he.enrollment}:
                    </Typography>
                    <Chip
                      size="small"
                      label={offering.is_open_enrollment ? he.open : he.closed}
                      sx={{
                        height: 22,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        bgcolor: offering.is_open_enrollment ? "#c8e6c9" : "#ffcdd2",
                        color: offering.is_open_enrollment ? "#1b5e20" : "#b71c1c",
                      }}
                    />
                  </>
                )}
              </Box>

              {offering.description ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {offering.description}
                </Typography>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "text.secondary" }}>
                  <MenuBookOutlinedIcon sx={{ fontSize: 18, opacity: 0.7 }} />
                  <Typography variant="caption">{offering.teacher_name}</Typography>
                </Box>
              )}
            </Box>
          </Card>
        );

        return (
          <Grid key={offering.id} size={{ xs: 12, sm: 6, lg: 4 }}>
            {link ? (
              <CardActionArea component={RouterLink} to={link} sx={{ borderRadius: 2, height: "100%" }}>
                {inner}
              </CardActionArea>
            ) : (
              inner
            )}
          </Grid>
        );
      })}
    </Grid>
  );
}

export interface CatalogCardGridProps {
  catalogs: CatalogCourse[];
  emptyMessage?: string;
  getCardLink?: (catalog: CatalogCourse) => string | undefined;
}

export function CatalogCardGrid({
  catalogs,
  emptyMessage = he.noCatalogCourses,
  getCardLink,
}: CatalogCardGridProps) {
  if (catalogs.length === 0) {
    return (
      <Typography color="text.secondary" textAlign="center" py={6}>
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <Grid container spacing={2.5}>
      {catalogs.map((catalog, index) => {
        const { bg, accent } = courseCardColor(index);
        const link = getCardLink?.(catalog);
        const inner = (
          <Card elevation={0} sx={{ height: "100%", bgcolor: bg, borderRadius: 2, border: "1px solid rgba(0,0,0,0.06)" }}>
            <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 1.5, minHeight: 140 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: accent, color: "#fff", fontWeight: 700 }}>
                  {catalog.name.trim()[0]?.toUpperCase() ?? "?"}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {catalog.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(catalog.created_at)}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip size="small" label={`${he.exams}: ${catalog.exam_count}`} />
                <Chip size="small" label={`תרגילים: ${catalog.exercise_count}`} variant="outlined" />
              </Box>
              {catalog.description && (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {catalog.description}
                </Typography>
              )}
            </Box>
          </Card>
        );
        return (
          <Grid key={catalog.id} size={{ xs: 12, sm: 6, lg: 4 }}>
            {link ? (
              <CardActionArea component={RouterLink} to={link} sx={{ borderRadius: 2, height: "100%" }}>
                {inner}
              </CardActionArea>
            ) : (
              inner
            )}
          </Grid>
        );
      })}
    </Grid>
  );
}

import { useMemo, useState } from "react";
import { Alert, Box, Button, Skeleton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ShareIcon from "@mui/icons-material/Share";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import { CatalogCardGrid } from "../../components/CourseCardGrid/CourseCardGrid";
import CreateCatalogDialog from "../../components/courses/CreateCatalogDialog";
import ListPageToolbar from "../../components/ListPageToolbar";
import ShareWithTeacherDialog from "../../components/ShareWithTeacherDialog";
import EmptyState from "../../components/ui/EmptyState";
import ListSearchField from "../../components/ui/ListSearchField";
import type { CatalogCourse } from "../../api/client";
import { useTeacherCatalogs } from "../../hooks/useTeacherCatalogs";
import { he } from "../../i18n/he";
import { matchesQuery } from "../../utils/examFilters";

/** Cours du catalogue : recherche, création et partage avec un autre professeur. */
export default function TeacherCatalogCoursesPage() {
  const data = useTeacherCatalogs();
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [shareCatalog, setShareCatalog] = useState<CatalogCourse | null>(null);
  const [notice, setNotice] = useState("");
  const visible = useMemo(
    () => data.catalogs.filter((c) => matchesQuery([c.name, c.description ?? ""], query)),
    [data.catalogs, query],
  );

  return (
    <Box sx={{ width: "100%" }} dir="rtl">
      <ListPageToolbar
        title={he.catalogCourses}
        subtitle={`${he.catalogCoursesSubtitle} — ${he.catalogCoursePerTeacherHint}`}
        titleVariant="h5"
        addLabel={he.createCatalogCourse}
        onAdd={() => setCreateOpen(true)}
      />
      {data.error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => data.setError("")}>{data.error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice("")}>{notice}</Alert>}
      {data.loading ? (
        <Skeleton variant="rounded" height={220} />
      ) : data.catalogs.length === 0 ? (
        <EmptyState
          title={he.catalogEmptyTitle}
          description={he.catalogEmptyHint}
          icon={<LibraryBooksIcon />}
          action={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>{he.createCatalogCourse}</Button>}
        />
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            <ListSearchField value={query} placeholder={he.catalogSearch} onChange={setQuery} />
          </Box>
          <CatalogCardGrid
            catalogs={visible}
            emptyMessage={he.catalogNoMatch}
            renderFooter={(c) => (
              <Button size="small" startIcon={<ShareIcon />} onClick={() => setShareCatalog(c)}>
                {he.shareCatalog}
              </Button>
            )}
          />
        </>
      )}
      <CreateCatalogDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={data.create} />
      <ShareWithTeacherDialog
        open={!!shareCatalog}
        kind="catalog"
        catalogId={shareCatalog?.id}
        itemLabel={shareCatalog?.name ?? ""}
        onClose={() => setShareCatalog(null)}
        onSent={() => setNotice(he.shareSent)}
      />
    </Box>
  );
}

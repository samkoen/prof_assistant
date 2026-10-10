import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Switch, TextField, Tooltip } from "@mui/material";
import DisabledActionTooltip from "../DisabledActionTooltip";
import type { CreateOfferingState } from "../../hooks/useCreateOffering";
import { he } from "../../i18n/he";
import { NEW_CATALOG_ID, isNewCatalog } from "../../utils/offeringForm";
import Spinner from "../ui/Spinner";

function CatalogFields({ s }: { s: CreateOfferingState }) {
  const { form, newCatalog, catalogs } = s;
  return (
    <>
      <TextField select required fullWidth label={he.selectCatalogCourse} value={form.catalog_course_id} onChange={(e) => s.setForm({ ...form, catalog_course_id: e.target.value })}>
        <MenuItem value={NEW_CATALOG_ID}>{he.catalogCourseNew}</MenuItem>
        {catalogs.map((c) => (
          <MenuItem key={c.id} value={String(c.id)}>
            {c.name}
          </MenuItem>
        ))}
      </TextField>
      {isNewCatalog(form) && (
        <>
          <TextField required fullWidth label={he.subject} value={newCatalog.name} placeholder="לדוגמה: מבני נתונים" helperText={he.createOfferingNewCatalogHint} onChange={(e) => s.setNewCatalog({ ...newCatalog, name: e.target.value })} />
          <TextField fullWidth multiline rows={2} label={he.description} value={newCatalog.description} onChange={(e) => s.setNewCatalog({ ...newCatalog, description: e.target.value })} />
        </>
      )}
    </>
  );
}

function GroupFields({ s }: { s: CreateOfferingState }) {
  const { form } = s;
  return (
    <>
      <TextField required label={he.groupName} value={form.group_name} onChange={(e) => s.setForm({ ...form, group_name: e.target.value })} />
      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField required fullWidth type="number" label={he.academicYear} value={form.academic_year} onChange={(e) => s.setForm({ ...form, academic_year: e.target.value })} />
        <TextField select fullWidth label={he.semester} value={form.semester} onChange={(e) => s.setForm({ ...form, semester: e.target.value })}>
          <MenuItem value="1">סמסטר א</MenuItem>
          <MenuItem value="2">סמסטר ב</MenuItem>
        </TextField>
      </Box>
      <TextField multiline rows={2} label={he.description} value={form.description} onChange={(e) => s.setForm({ ...form, description: e.target.value })} />
    </>
  );
}

function EnrollmentSwitches({ s }: { s: CreateOfferingState }) {
  const { form } = s;
  return (
    <>
      <FormControlLabel control={<Switch checked={form.is_open_enrollment} onChange={(e) => s.setForm({ ...form, is_open_enrollment: e.target.checked })} />} label={he.openEnrollmentLabel} />
      <Tooltip title={!form.is_open_enrollment ? he.autoApproveRequiresOpen : ""} disableHoverListener={form.is_open_enrollment} arrow>
        <span style={{ display: "inline-block" }}>
          <FormControlLabel
            control={<Switch checked={form.auto_approve_enrollment} disabled={!form.is_open_enrollment} onChange={(e) => s.setForm({ ...form, auto_approve_enrollment: e.target.checked })} />}
            label={he.autoApproveEnrollment}
          />
        </span>
      </Tooltip>
    </>
  );
}

/** Dialogue de création d'une instance de cours (groupe) : cours, groupe, période, inscription. */
export default function CreateOfferingDialog({ state: s }: { state: CreateOfferingState }) {
  return (
    <Dialog open={s.open} onClose={s.close} fullWidth maxWidth="sm" dir="rtl">
      <DialogTitle>{he.createOffering}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
        {s.loadingCatalogs ? (
          <Box display="flex" justifyContent="center" py={4}>
            <Spinner size={32} />
          </Box>
        ) : (
          <>
            <CatalogFields s={s} />
            <GroupFields s={s} />
            <EnrollmentSwitches s={s} />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={s.close} disabled={s.submitting}>
          {he.cancel}
        </Button>
        <DisabledActionTooltip disabled={Boolean(s.missing) || s.submitting} disabledReason={s.missing ?? undefined}>
          <Button variant="contained" onClick={s.submit}>
            {s.submitting ? he.loading : he.submit}
          </Button>
        </DisabledActionTooltip>
      </DialogActions>
    </Dialog>
  );
}

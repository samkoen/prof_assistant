import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SaveIcon from "@mui/icons-material/Save";
import { api, ApiError, type CourseOffering } from "../api/client";
import { he } from "../i18n/he";
import { buildJoinCourseUrl } from "../utils/joinCourse";

interface OfferingEnrollmentSettingsProps {
  offering: CourseOffering;
  onUpdated: (offering: CourseOffering) => void;
  onError: (message: string) => void;
}

export default function OfferingEnrollmentSettings({
  offering,
  onUpdated,
  onError,
}: OfferingEnrollmentSettingsProps) {
  const [open, setOpen] = useState(offering.is_open_enrollment);
  const [autoApprove, setAutoApprove] = useState(offering.auto_approve_enrollment);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const joinUrl = buildJoinCourseUrl(offering.id);

  useEffect(() => {
    setOpen(offering.is_open_enrollment);
    setAutoApprove(offering.auto_approve_enrollment);
  }, [offering]);

  const save = async () => {
    setSaving(true);
    onError("");
    try {
      const updated = await api<CourseOffering>(`/api/courses/${offering.id}/enrollment-settings`, {
        method: "PATCH",
        body: JSON.stringify({
          is_open_enrollment: open,
          auto_approve_enrollment: autoApprove,
        }),
      });
      onUpdated(updated);
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [joinUrl]);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent dir="rtl">
        <Typography variant="h6" gutterBottom>
          {he.enrollmentSettings}
        </Typography>
        <FormControlLabel
          control={<Switch checked={open} onChange={(e) => setOpen(e.target.checked)} />}
          label={he.openEnrollmentLabel}
          sx={{ display: "block", mb: 1 }}
        />
        <Tooltip title={!open ? he.autoApproveRequiresOpen : ""} disableHoverListener={open} arrow>
          <span style={{ display: "inline-block" }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoApprove}
                  onChange={(e) => setAutoApprove(e.target.checked)}
                  disabled={!open}
                />
              }
              label={he.autoApproveEnrollment}
              sx={{ display: "block", mb: 2 }}
            />
          </span>
        </Tooltip>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {he.joinLinkHint}
        </Typography>
        <TextField
          value={joinUrl}
          fullWidth
          size="small"
          dir="ltr"
          InputProps={{ readOnly: true }}
          sx={{ mb: 1 }}
        />
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />} onClick={copyLink}>
            {copied ? he.joinLinkCopied : he.copyJoinLink}
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={save}
            disabled={saving}
          >
            {saving ? he.loading : he.saveEnrollmentSettings}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

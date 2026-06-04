import { useCallback, useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import { api, ApiError, offeringLabel, type CourseOffering } from "../api/client";
import { he } from "../i18n/he";
import {
  buildJoinCourseUrl,
  DEFAULT_JOIN_LINK_VALID_DAYS,
  formatJoinExpiresAt,
  isJoinLinkExpired,
  JOIN_LINK_VALID_DAY_OPTIONS,
} from "../utils/joinCourse";
import JoinCourseQrCode from "./JoinCourseQrCode";
import JoinCourseQrFullscreenDialog from "./JoinCourseQrFullscreenDialog";

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
  const [validDays, setValidDays] = useState(DEFAULT_JOIN_LINK_VALID_DAYS);
  const [saving, setSaving] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  const joinToken = offering.join_token ?? "";
  const joinUrl = joinToken ? buildJoinCourseUrl(joinToken) : "";
  const linkExpired = isJoinLinkExpired(offering.join_token_expires_at);

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

  const renewLink = async () => {
    setRenewing(true);
    onError("");
    try {
      const updated = await api<CourseOffering>(`/api/courses/${offering.id}/join-link/renew`, {
        method: "POST",
        body: JSON.stringify({ valid_days: validDays }),
      });
      onUpdated(updated);
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setRenewing(false);
    }
  };

  const copyLink = useCallback(async () => {
    if (!joinUrl) return;
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [joinUrl]);

  return (
    <Accordion sx={{ mb: 3 }} defaultExpanded={false}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">{he.enrollmentSettings}</Typography>
      </AccordionSummary>
      <AccordionDetails>
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
        {linkExpired && (
          <Typography variant="body2" color="error.main" sx={{ mb: 1 }}>
            {he.joinLinkExpiredTeacher}
          </Typography>
        )}
        {offering.join_token_expires_at && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {he.joinLinkValidUntil}: {formatJoinExpiresAt(offering.join_token_expires_at)}
          </Typography>
        )}

        <FormControl size="small" sx={{ minWidth: 160, mb: 2 }} dir="rtl">
          <InputLabel id="join-valid-days-label">{he.joinLinkValidDays}</InputLabel>
          <Select
            labelId="join-valid-days-label"
            label={he.joinLinkValidDays}
            value={validDays}
            onChange={(e) => setValidDays(Number(e.target.value))}
          >
            {JOIN_LINK_VALID_DAY_OPTIONS.map((d) => (
              <MenuItem key={d} value={d}>
                {he.joinLinkValidDaysOption(d)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          value={joinUrl || he.joinLinkUnavailable}
          fullWidth
          size="small"
          dir="ltr"
          InputProps={{ readOnly: true }}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "flex-start", mb: 2 }}>
          {joinUrl && <JoinCourseQrCode url={joinUrl} />}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, maxWidth: 280 }}>
              {he.joinQrHint}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<QrCode2Icon />}
              onClick={() => setQrDialogOpen(true)}
              disabled={!open || !joinUrl}
              sx={{ display: "block", mb: 1 }}
            >
              {he.showJoinQrFullscreen}
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={renewLink}
              disabled={renewing}
            >
              {renewing ? he.loading : he.renewJoinLink}
            </Button>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={copyLink}
            disabled={!joinUrl}
          >
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
        {joinUrl && (
          <JoinCourseQrFullscreenDialog
            open={qrDialogOpen}
            joinUrl={joinUrl}
            title={offeringLabel(offering)}
            onClose={() => setQrDialogOpen(false)}
          />
        )}
      </AccordionDetails>
    </Accordion>
  );
}

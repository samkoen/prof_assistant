import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import BidiTextField from "../components/BidiTextField";
import ListPageToolbar from "../components/ListPageToolbar";
import StudentGeminiConfigCard from "../components/StudentGeminiConfigCard";
import { ApiError, updateMyProfile } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { he } from "../i18n/he";

type ProfileForm = {
  full_name: string;
  email: string;
  phone: string;
  student_id: string;
  current_password: string;
  new_password: string;
};

function formFromUser(user: NonNullable<ReturnType<typeof useAuth>["user"]>): ProfileForm {
  return {
    full_name: user.full_name,
    email: user.email,
    phone: user.phone ?? "",
    student_id: user.student_id ?? "",
    current_password: "",
    new_password: "",
  };
}

function buildPayload(form: ProfileForm, user: NonNullable<ReturnType<typeof useAuth>["user"]>) {
  const payload: Parameters<typeof updateMyProfile>[0] = {};
  const trimmedName = form.full_name.trim();
  if (trimmedName && trimmedName !== user.full_name) payload.full_name = trimmedName;

  const trimmedEmail = form.email.trim().toLowerCase();
  if (trimmedEmail && trimmedEmail !== user.email.toLowerCase()) payload.email = trimmedEmail;

  const phone = form.phone.trim();
  if (phone !== (user.phone ?? "")) payload.phone = phone || null;

  if (user.role === "student") {
    const sid = form.student_id.trim();
    if (sid !== (user.student_id ?? "")) payload.student_id = sid || null;
  }

  if (form.new_password) {
    payload.current_password = form.current_password;
    payload.new_password = form.new_password;
  }
  return payload;
}

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailNotice, setEmailNotice] = useState(false);

  useEffect(() => {
    if (user) setForm(formFromUser(user));
  }, [user]);

  const handleSave = async () => {
    if (!user || !form) return;
    setError("");
    setSuccess("");
    setEmailNotice(false);
    const payload = buildPayload(form, user);
    if (Object.keys(payload).length === 0) {
      setError(he.profileNoChanges);
      return;
    }
    setSaving(true);
    try {
      const res = await updateMyProfile(payload);
      await refresh();
      setForm(formFromUser(res.user));
      setSuccess(he.profileSaved);
      if (res.email_verification_sent) setEmailNotice(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  if (!user || !form) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box dir="rtl">
      <ListPageToolbar title={he.myProfile} subtitle={he.profileSubtitle} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}
      {emailNotice && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setEmailNotice(false)}>
          {he.profileEmailVerificationSent}
        </Alert>
      )}
      {!user.email_verified && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {he.profileEmailUnverified}
        </Alert>
      )}

      <Box display="flex" flexDirection="column" gap={2} maxWidth={480}>
        <BidiTextField
          label={he.fullName}
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          required
          fullWidth
          showDirectionHint
        />
        <TextField
          label={he.email}
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          fullWidth
          dir="ltr"
          data-bidi="off"
          slotProps={{ htmlInput: { dir: "ltr" } }}
        />
        <TextField
          label={he.phone}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          fullWidth
        />
        {user.role === "student" && (
          <TextField
            label={he.studentId}
            value={form.student_id}
            onChange={(e) => setForm({ ...form, student_id: e.target.value })}
            fullWidth
          />
        )}

        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle1" fontWeight={700}>
          {he.changePasswordSection}
        </Typography>
        <TextField
          label={he.currentPassword}
          type="password"
          value={form.current_password}
          onChange={(e) => setForm({ ...form, current_password: e.target.value })}
          fullWidth
          dir="ltr"
          data-bidi="off"
          slotProps={{ htmlInput: { dir: "ltr" } }}
        />
        <TextField
          label={he.newPassword}
          type="password"
          value={form.new_password}
          onChange={(e) => setForm({ ...form, new_password: e.target.value })}
          fullWidth
          dir="ltr"
          data-bidi="off"
          slotProps={{ htmlInput: { dir: "ltr", minLength: 6 } }}
        />

        <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ alignSelf: "flex-start" }}>
          {saving ? he.loading : he.saveProfile}
        </Button>
      </Box>

      {user.role === "student" && (
        <Box sx={{ mt: 3, maxWidth: 520 }}>
          <StudentGeminiConfigCard />
        </Box>
      )}
    </Box>
  );
}

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { api, ApiError, formatScopeSummary, type Exam } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { he } from "../i18n/he";

interface ExamScopeEditorProps {
  exam: Exam;
  editable: boolean;
  onSaved: (exam: Exam) => void;
  onError: (message: string) => void;
}

export default function ExamScopeEditor({ exam, editable, onSaved, onError }: ExamScopeEditorProps) {
  const { user } = useAuth();
  const [scopeTeacher, setScopeTeacher] = useState<"any" | "me">("any");
  const [scopeYear, setScopeYear] = useState("");
  const [scopeSemester, setScopeSemester] = useState("");
  const [scopeGroup, setScopeGroup] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setScopeTeacher(exam.scope_teacher_id != null ? "me" : "any");
    setScopeYear(exam.scope_academic_year != null ? String(exam.scope_academic_year) : "");
    setScopeSemester(exam.scope_semester != null ? String(exam.scope_semester) : "");
    setScopeGroup(exam.scope_group_name ?? "");
  }, [exam]);

  const save = async () => {
    setSaving(true);
    setSuccess("");
    onError("");
    try {
      const updated = await api<Exam>(`/api/exams/${exam.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          scope_teacher_id: scopeTeacher === "me" ? user?.id : null,
          scope_academic_year: scopeYear ? Number(scopeYear) : null,
          scope_semester: scopeSemester ? Number(scopeSemester) : null,
          scope_group_name: scopeGroup.trim() || null,
        }),
      });
      setSuccess(he.examScopeSaved);
      onSaved(updated);
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {he.examScope}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {formatScopeSummary(exam)}
        </Typography>
        {!editable ? (
          <Typography variant="caption" color="warning.main">
            {he.examNotEditable}
          </Typography>
        ) : (
          <>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                select
                label={he.teacher}
                value={scopeTeacher}
                onChange={(e) => setScopeTeacher(e.target.value as "any" | "me")}
                size="small"
              >
                <MenuItem value="any">{he.scopeAnyTeacher}</MenuItem>
                <MenuItem value="me">{he.scopeOnlyMe}</MenuItem>
              </TextField>
              <TextField
                label={he.academicYear}
                value={scopeYear}
                onChange={(e) => setScopeYear(e.target.value)}
                placeholder={he.scopeAny}
                size="small"
              />
              <TextField
                select
                label={he.semester}
                value={scopeSemester}
                onChange={(e) => setScopeSemester(e.target.value)}
                size="small"
              >
                <MenuItem value="">{he.scopeAny}</MenuItem>
                <MenuItem value="1">סמסטר א</MenuItem>
                <MenuItem value="2">סמסטר ב</MenuItem>
              </TextField>
              <TextField
                label={he.groupName}
                value={scopeGroup}
                onChange={(e) => setScopeGroup(e.target.value)}
                placeholder={he.scopeAny}
                size="small"
              />
            </Box>
            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {success}
              </Alert>
            )}
            <Button
              variant="contained"
              size="small"
              startIcon={<SaveIcon />}
              onClick={save}
              disabled={saving}
              sx={{ mt: 2 }}
            >
              {saving ? he.loading : he.saveExamScope}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

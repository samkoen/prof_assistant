import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Typography } from "@mui/material";
import HebrewCardRow from "./ui/HebrewCardRow";
import { hebrewAlignRightSx } from "../styles/hebrewAlign";
import {
  api,
  ApiError,
  verifyStudentEmailBypass,
  type StudentAccount,
} from "../api/client";
import { he } from "../i18n/he";

interface UnverifiedStudentsPanelProps {
  onCountChange?: (count: number) => void;
}

export default function UnverifiedStudentsPanel({ onCountChange }: UnverifiedStudentsPanelProps) {
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const all = await api<StudentAccount[]>("/api/students");
      const unverified = all.filter((s) => !s.email_verified);
      setStudents(unverified);
      onCountChange?.(unverified.length);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
      onCountChange?.(0);
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    load();
  }, [load]);

  const verify = async (student: StudentAccount) => {
    setVerifyingId(student.id);
    setError("");
    try {
      await verifyStudentEmailBypass(student.id);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={2}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (students.length === 0) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 1, ...hebrewAlignRightSx }}>
      {error && (
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {students.map((s) => (
        <HebrewCardRow
          key={s.id}
          text={
            <>
              <Chip size="small" label={he.pendingEmailVerificationRequest} color="warning" sx={{ mb: 1 }} />
              <Typography fontWeight={600}>{s.full_name}</Typography>
              <Typography variant="body2" color="text.secondary" dir="ltr" sx={{ textAlign: "left" }}>
                {s.email}
              </Typography>
            </>
          }
          actions={
            <Button
              size="small"
              variant="contained"
              color="success"
              disabled={verifyingId === s.id}
              onClick={() => verify(s)}
            >
              {he.verifyStudentEmail}
            </Button>
          }
        />
      ))}
    </Box>
  );
}

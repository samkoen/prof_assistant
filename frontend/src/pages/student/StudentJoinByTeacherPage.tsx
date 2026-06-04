import { useCallback, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid2 as Grid,
  TextField,
  Typography,
} from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import ListPageToolbar from "../../components/ListPageToolbar";
import JoinCourseQrScannerDialog from "../../components/JoinCourseQrScannerDialog";
import {
  api,
  ApiError,
  offeringLabel,
  type CourseOffering,
  type TeacherOpenOfferings,
} from "../../api/client";
import { he } from "../../i18n/he";

async function requestEnrollment(offeringId: number): Promise<{ status: string }> {
  return api("/api/enrollments/request", {
    method: "POST",
    body: JSON.stringify({ offering_id: offeringId }),
  });
}

function TeacherSearchForm({
  email,
  loading,
  onEmailChange,
  onSearch,
}: {
  email: string;
  loading: boolean;
  onEmailChange: (v: string) => void;
  onSearch: () => void;
}) {
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };
  return (
    <Box component="form" onSubmit={submit} dir="rtl" sx={{ maxWidth: 480, mb: 3 }}>
      <TextField
        label={he.teacherEmail}
        type="email"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        required
        fullWidth
        dir="ltr"
        placeholder="teacher@example.com"
        sx={{ mb: 2 }}
      />
      <Button type="submit" variant="contained" disabled={loading || !email.trim()}>
        {loading ? he.loading : he.searchTeacherCourses}
      </Button>
    </Box>
  );
}

function OfferingJoinCard({
  offering,
  joiningId,
  onJoin,
}: {
  offering: CourseOffering;
  joiningId: number | null;
  onJoin: (o: CourseOffering) => void;
}) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={600}>
          {offeringLabel(offering)}
        </Typography>
        {offering.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
            {offering.description}
          </Typography>
        )}
        <Button
          variant="outlined"
          onClick={() => onJoin(offering)}
          disabled={joiningId === offering.id}
        >
          {joiningId === offering.id ? he.loading : he.joinCourse}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function StudentJoinByTeacherPage() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<TeacherOpenOfferings | null>(null);
  const [searching, setSearching] = useState(false);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchByTeacher = useCallback(async (resetResult: boolean) => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setSearching(true);
    setError("");
    if (resetResult) {
      setMessage("");
      setResult(null);
    }
    try {
      const data = await api<TeacherOpenOfferings>(
        `/api/courses/by-teacher-email?email=${encodeURIComponent(trimmed)}`
      );
      setResult(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setSearching(false);
    }
  }, [email]);

  const search = () => fetchByTeacher(true);

  const resetSearch = () => {
    setResult(null);
    setError("");
    setMessage("");
  };

  const join = async (offering: CourseOffering) => {
    setJoiningId(offering.id);
    setMessage("");
    setError("");
    try {
      const res = await requestEnrollment(offering.id);
      setMessage(res.status === "approved" ? he.enrollmentApproved : he.enrollmentRequestSent);
      await fetchByTeacher(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <Box sx={{ width: "100%" }} dir="rtl">
      <ListPageToolbar title={he.joinByTeacherTitle} subtitle={he.joinByTeacherSubtitle} />
      {message && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {!result ? (
        <>
          <Button
            variant="contained"
            startIcon={<QrCodeScannerIcon />}
            onClick={() => setScannerOpen(true)}
            sx={{ mb: 2 }}
          >
            {he.scanJoinQr}
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {he.scanJoinQrHint}
          </Typography>
          <Divider sx={{ mb: 3 }}>{he.joinOrScanQr}</Divider>
          <TeacherSearchForm
            email={email}
            loading={searching}
            onEmailChange={setEmail}
            onSearch={search}
          />
        </>
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {he.teacherCoursesFor(result.teacher_name)}
            </Typography>
            <Typography variant="body2" color="text.secondary" dir="ltr" sx={{ textAlign: "right" }}>
              {result.teacher_email}
            </Typography>
            <Button size="small" sx={{ mt: 1 }} onClick={resetSearch}>
              {he.changeTeacher}
            </Button>
          </Box>
          {result.offerings.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={6}>
              {he.noTeacherOpenCourses}
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {result.offerings.map((o) => (
                <Grid key={o.id} size={{ xs: 12, md: 6 }}>
                  <OfferingJoinCard offering={o} joiningId={joiningId} onJoin={join} />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
      {searching && !result && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={32} />
        </Box>
      )}
      <JoinCourseQrScannerDialog open={scannerOpen} onClose={() => setScannerOpen(false)} />
    </Box>
  );
}

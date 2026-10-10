import { Alert, Box, Skeleton, Stack, Typography } from "@mui/material";
import SourceDropZone from "./exams/ai/SourceDropZone";
import SourceFileRow from "./exams/ai/SourceFileRow";
import { useGeminiSources } from "../hooks/useGeminiSources";
import { he } from "../i18n/he";
import type { GeminiSource } from "../types/geminiSource";

type Props = {
  examId: number;
  disabled?: boolean;
  onSourcesChange: (sources: GeminiSource[]) => void;
  onError: (message: string) => void;
};

/** Étape 1 de la demande AI : fichiers joints (dépôt multiple) avec un rôle par fichier. */
export default function ExamGeminiSourcesPanel({ examId, disabled, onSourcesChange, onError }: Props) {
  const { sources, loading, uploading, upload, setRoles, remove } = useGeminiSources({ examId, onSourcesChange, onError });
  return (
    <Box sx={{ mb: 3 }} dir="rtl">
      <Typography variant="h6" fontWeight={800} sx={{ textAlign: "right" }}>
        {he.geminiBriefSourcesTitle}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, textAlign: "right" }}>
        {he.geminiSourcesIntro} {he.geminiSourcesScopeHint}
      </Typography>
      <SourceDropZone disabled={disabled} uploading={uploading} onFiles={upload} />
      {loading ? (
        <Skeleton variant="rounded" height={48} sx={{ mt: 1.5 }} />
      ) : sources.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: "right" }}>
          {he.geminiSourcesEmpty}
        </Typography>
      ) : (
        <Stack spacing={1} sx={{ mt: 1.5 }}>
          {sources.map((src) => (
            <SourceFileRow key={src.id} source={src} disabled={disabled} onRolesChange={setRoles} onDelete={remove} />
          ))}
        </Stack>
      )}
      <Alert severity="info" sx={{ mt: 1.5 }}>
        {he.geminiSourcesPrivacy}
      </Alert>
    </Box>
  );
}

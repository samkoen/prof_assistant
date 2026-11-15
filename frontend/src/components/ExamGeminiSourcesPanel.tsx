import { Box, Skeleton, Stack, Typography } from "@mui/material";
import SourceDropZone from "./exams/ai/SourceDropZone";
import SourceFileRow from "./exams/ai/SourceFileRow";
import { useGeminiSources } from "../hooks/useGeminiSources";
import { he } from "../i18n/he";
import type { GeminiSource } from "../types/geminiSource";
import type { SourceRole } from "../utils/geminiSourceRole";

type Props = {
  examId: number;
  disabled?: boolean;
  onSourcesChange: (sources: GeminiSource[]) => void;
  onError: (message: string) => void;
};

const hintSx = { display: "block", mt: 1, textAlign: "right" } as const;

/** Liste des fichiers déposés ; l'explication des rôles n'apparaît qu'une fois qu'il y a un fichier à qualifier. */
function SourcesList({ sources, disabled, onRolesChange, onDelete }: {
  sources: GeminiSource[];
  disabled?: boolean;
  onRolesChange: (source: GeminiSource, roles: SourceRole[]) => void;
  onDelete: (source: GeminiSource) => void;
}) {
  return (
    <>
      <Stack spacing={1} sx={{ mt: 1.5 }}>
        {sources.map((src) => (
          <SourceFileRow key={src.id} source={src} disabled={disabled} onRolesChange={onRolesChange} onDelete={onDelete} />
        ))}
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={hintSx}>
        {he.geminiSourcesIntro} {he.geminiSourcesScopeHint}
      </Typography>
    </>
  );
}

/** Étape 1 de la demande AI : zone de dépôt d'abord, explications seulement quand elles servent. */
export default function ExamGeminiSourcesPanel({ examId, disabled, onSourcesChange, onError }: Props) {
  const { sources, loading, uploading, upload, setRoles, remove } = useGeminiSources({ examId, onSourcesChange, onError });
  return (
    <Box sx={{ mb: 3 }} dir="rtl">
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1, textAlign: "right" }}>
        {he.geminiBriefSourcesTitle}
      </Typography>
      <SourceDropZone disabled={disabled} uploading={uploading} onFiles={upload} />
      {loading && <Skeleton variant="rounded" height={48} sx={{ mt: 1.5 }} />}
      {!loading && sources.length > 0 && (
        <SourcesList sources={sources} disabled={disabled} onRolesChange={setRoles} onDelete={remove} />
      )}
      <Typography variant="caption" color="text.secondary" sx={hintSx}>
        {he.geminiSourcesPrivacy}
      </Typography>
    </Box>
  );
}

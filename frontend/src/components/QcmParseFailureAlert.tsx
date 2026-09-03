import { Alert, Box, Button, Typography } from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import DisabledActionTooltip from "./DisabledActionTooltip";
import type { ParseError } from "../utils/qcmImportParser";
import {
  geminiParseErrorDetail,
  geminiParseErrorLocation,
} from "../utils/geminiParseErrors";
import { hebrewActionsBarRtlSx, hebrewAlignRightSx } from "../styles/hebrewAlign";
import { he } from "../i18n/he";

type Props = {
  errors: ParseError[];
  validCount: number;
  hint: string;
  editable: boolean;
  importing: boolean;
  onImportValid: () => void;
};

function ParseErrorList({ errors }: { errors: ParseError[] }) {
  return (
    <Box component="ul" sx={{ m: 0, pr: 2.5, mb: 2 }}>
      {errors.map((e) => (
        <Typography key={`${e.block}-${e.message}`} component="li" variant="body2">
          <strong>{geminiParseErrorLocation(e.block)}:</strong> {geminiParseErrorDetail(e)}
        </Typography>
      ))}
    </Box>
  );
}

export default function QcmParseFailureAlert({
  errors,
  validCount,
  hint,
  editable,
  importing,
  onImportValid,
}: Props) {
  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={hebrewAlignRightSx}>
        {he.geminiParseFailedTitle}
      </Typography>
      <Typography variant="body2" paragraph sx={{ mb: 1, ...hebrewAlignRightSx }}>
        {hint}
      </Typography>
      <ParseErrorList errors={errors} />
      {validCount > 0 && (
        <ImportValidButton
          validCount={validCount}
          skipped={errors.length}
          editable={editable}
          importing={importing}
          onImportValid={onImportValid}
        />
      )}
    </Alert>
  );
}

function ImportValidButton({
  validCount,
  skipped,
  editable,
  importing,
  onImportValid,
}: {
  validCount: number;
  skipped: number;
  editable: boolean;
  importing: boolean;
  onImportValid: () => void;
}) {
  return (
    <Box sx={hebrewActionsBarRtlSx}>
      <DisabledActionTooltip
        disabled={!editable || importing}
        disabledReason={!editable ? he.examNotEditable : undefined}
      >
        <Button
          variant="contained"
          size="small"
          startIcon={<UploadIcon />}
          onClick={onImportValid}
          disabled={!editable || importing}
        >
          {importing ? he.loading : he.geminiImportValidSkipBroken(validCount, skipped)}
        </Button>
      </DisabledActionTooltip>
    </Box>
  );
}

import { Box, Stack, Typography } from "@mui/material";
import { he } from "../../i18n/he";
import { brand, softCardShadow } from "../../theme/brand";
import { DEFAULT_CALLS_PER_CREDIT, teacherCostExamples, type CreditAudience } from "../../utils/creditCost";

export default function CreditCostNotes({
  audience,
  callsPerCredit = DEFAULT_CALLS_PER_CREDIT,
}: {
  audience: CreditAudience;
  callsPerCredit?: number;
}) {
  return (
    <Stack sx={{ gap: 2, mt: 2 }}>
      {audience !== "student" && <TeacherNote callsPerCredit={callsPerCredit} />}
      {audience !== "teacher" && <StudentNote />}
    </Stack>
  );
}

function TeacherNote({ callsPerCredit }: { callsPerCredit: number }) {
  const examples = teacherCostExamples(callsPerCredit);
  const lines = [
    he.creditCostTeacherUsual(callsPerCredit),
    he.creditCostTeacherLength,
    he.creditCostTeacherSplit(callsPerCredit),
    he.creditCostTeacherExamples(examples.five, examples.twelve, examples.thirty),
  ];
  return <Note title={he.creditCostTeacherTitle} lines={lines} />;
}

function StudentNote() {
  const lines = [he.creditCostStudentEach, he.creditCostStudentFactors, he.creditCostStudentAgain];
  return <Note title={he.creditCostStudentTitle} lines={lines} />;
}

function Note({ title, lines }: { title: string; lines: string[] }) {
  return (
    <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: brand.white, boxShadow: softCardShadow }}>
      <Typography fontWeight={800} sx={{ mb: 1 }}>{title}</Typography>
      <Stack sx={{ gap: 1 }}>
        {lines.map((line) => (
          <Typography key={line} color="text.secondary" sx={{ lineHeight: 1.7 }}>{line}</Typography>
        ))}
      </Stack>
    </Box>
  );
}

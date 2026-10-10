import { useMemo, useState } from "react";
import { api, ApiError } from "../../api/client";
import { he } from "../../i18n/he";
import { abandonActiveGeminiSession } from "../../utils/geminiBatchGeneration";
import { canImportValidQuestions, remainingPasteAfterImport } from "../../utils/qcmPartialImport";
import { parseQcmText, toImportPayload } from "../../utils/qcmImportParser";
import type { EditorFeedback } from "./useEditorFeedback";

/** Import de questions collées (format QCM) : analyse en direct puis envoi. */
export function useQcmImport(id: number, reload: () => Promise<void>, fb: EditorFeedback) {
  const [paste, setPaste] = useState("");
  const [importing, setImporting] = useState(false);
  const parseResult = useMemo(() => parseQcmText(paste), [paste]);

  const importQuestions = async () => {
    if (!canImportValidQuestions(parseResult)) return;
    setImporting(true);
    fb.setError("");
    fb.setSuccess("");
    try {
      const body = JSON.stringify({ questions: toImportPayload(parseResult.questions) });
      const res = await api<{ imported_count: number }>(`/api/exams/${id}/questions/import`, { method: "POST", body });
      fb.setSuccess(`${he.importSuccess}: ${res.imported_count} ${he.questionsImported}`);
      setPaste(remainingPasteAfterImport(paste));
      await abandonActiveGeminiSession(id).catch(() => {});
      await reload();
    } catch (e) {
      fb.setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setImporting(false);
    }
  };

  return { paste, setPaste, parseResult, importing, importQuestions };
}

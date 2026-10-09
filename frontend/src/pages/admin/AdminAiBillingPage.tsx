import { useEffect, useState } from "react";
import { Alert, Box, Button, TextField, Typography } from "@mui/material";
import ListPageToolbar from "../../components/ListPageToolbar";
import { api } from "../../api/client";
import { he } from "../../i18n/he";
import { hebrewAlignRightSx } from "../../styles/hebrewAlign";
import {
  draftFromApi,
  payloadFromDraft,
  type BillingSettingsApi,
  type BillingSettingsDraft,
} from "../../utils/billingSettings";

const numberField = { htmlInput: { dir: "ltr" as const } };

function QuotaFields({
  draft,
  onChange,
}: {
  draft: BillingSettingsDraft;
  onChange: (next: BillingSettingsDraft) => void;
}) {
  const set = (key: "studentFree" | "teacherFree" | "callsPerCredit", value: string) =>
    onChange({ ...draft, [key]: value });
  return (
    <Box sx={{ display: "grid", gap: 2, mb: 3 }}>
      <TextField label={he.aiBillingStudentFree} value={draft.studentFree} onChange={(e) => set("studentFree", e.target.value)} slotProps={numberField} />
      <TextField label={he.aiBillingTeacherFree} value={draft.teacherFree} onChange={(e) => set("teacherFree", e.target.value)} slotProps={numberField} />
      <TextField label={he.aiBillingCallsPerCredit} value={draft.callsPerCredit} onChange={(e) => set("callsPerCredit", e.target.value)} slotProps={numberField} />
    </Box>
  );
}

function packTitle(product: string, code: string): string {
  const who = product === "teacher_generation" ? he.aiBillingTeacherPack : he.aiBillingStudentPack;
  return `${who} ${code}`;
}

function PackRow({
  pack,
  onChange,
}: {
  pack: BillingSettingsDraft["packs"][number];
  onChange: (credits: string, priceIls: string) => void;
}) {
  return (
    <Box sx={{ display: "grid", gap: 1, mb: 2 }}>
      <Typography variant="subtitle2" sx={hebrewAlignRightSx}>
        {packTitle(pack.product, pack.code)}
      </Typography>
      <TextField label={he.aiBillingPackCredits} value={pack.credits} onChange={(e) => onChange(e.target.value, pack.priceIls)} slotProps={numberField} />
      <TextField label={he.aiBillingPackPrice} value={pack.priceIls} onChange={(e) => onChange(pack.credits, e.target.value)} slotProps={numberField} />
    </Box>
  );
}

function replacePack(draft: BillingSettingsDraft, index: number, credits: string, priceIls: string) {
  const packs = draft.packs.slice();
  packs[index] = { ...packs[index], credits, priceIls };
  return { ...draft, packs };
}

async function persistSettings(draft: BillingSettingsDraft): Promise<BillingSettingsDraft> {
  const body = payloadFromDraft(draft);
  if (!body) throw new Error(he.aiBillingInvalid);
  const saved = await api<BillingSettingsApi>("/api/admin/ai-billing", {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return draftFromApi(saved);
}

function BillingEditor({
  draft,
  saving,
  onChange,
  onSave,
}: {
  draft: BillingSettingsDraft;
  saving: boolean;
  onChange: (next: BillingSettingsDraft) => void;
  onSave: () => void;
}) {
  return (
    <>
      <QuotaFields draft={draft} onChange={onChange} />
      {draft.packs.map((pack, index) => (
        <PackRow
          key={pack.code}
          pack={pack}
          onChange={(credits, priceIls) => onChange(replacePack(draft, index, credits, priceIls))}
        />
      ))}
      <Button variant="contained" disabled={saving} onClick={onSave}>
        {he.aiBillingSave}
      </Button>
    </>
  );
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : he.errorGeneric;
}

function useAdminBilling() {
  const [draft, setDraft] = useState<BillingSettingsDraft | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    void api<BillingSettingsApi>("/api/admin/ai-billing")
      .then((data) => setDraft(draftFromApi(data)))
      .catch((e) => setError(messageOf(e)));
  }, []);
  return { draft, setDraft, error, setError, success, setSuccess, saving, setSaving };
}

async function runSave(form: ReturnType<typeof useAdminBilling>) {
  if (!form.draft) return;
  form.setSaving(true);
  form.setError("");
  form.setSuccess("");
  try {
    form.setDraft(await persistSettings(form.draft));
    form.setSuccess(he.aiBillingSaved);
  } catch (e) {
    form.setError(messageOf(e));
  } finally {
    form.setSaving(false);
  }
}

export default function AdminAiBillingPage() {
  const form = useAdminBilling();
  return (
    <Box dir="rtl" sx={hebrewAlignRightSx}>
      <ListPageToolbar title={he.aiBillingAdminTitle} subtitle={he.aiBillingAdminSubtitle} />
      {form.error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => form.setError("")}>{form.error}</Alert>}
      {form.success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => form.setSuccess("")}>{form.success}</Alert>}
      {form.draft && (
        <BillingEditor
          draft={form.draft}
          saving={form.saving}
          onChange={form.setDraft}
          onSave={() => void runSave(form)}
        />
      )}
    </Box>
  );
}

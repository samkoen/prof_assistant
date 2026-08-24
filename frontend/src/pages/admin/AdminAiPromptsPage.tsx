import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Box, Chip, IconButton, Tooltip } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AiPromptEditDialog from "../../components/AiPromptEditDialog";
import DataListTable from "../../components/DataListTable/DataListTable";
import type { DataListColumnDef } from "../../components/DataListTable/types";
import ListPageToolbar from "../../components/ListPageToolbar";
import {
  fetchAiPromptTemplates,
  resetAiPromptTemplate,
  updateAiPromptTemplate,
  type AiPromptTemplate,
} from "../../api/aiPrompts";
import { ApiError } from "../../api/client";
import { he } from "../../i18n/he";
import { aiPromptLabel } from "../../utils/aiPromptLabels";

export default function AdminAiPromptsPage() {
  const [rows, setRows] = useState<AiPromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selected, setSelected] = useState<AiPromptTemplate | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await fetchAiPromptTemplates());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveBody = async (body: string) => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateAiPromptTemplate(selected.key, body);
      setSuccess(he.aiPromptSaved);
      setSelected(null);
      setRows((prev) => prev.map((row) => (row.key === updated.key ? updated : row)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  const resetSelected = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const updated = await resetAiPromptTemplate(selected.key);
      setSuccess(he.aiPromptResetDone);
      setSelected(updated);
      setRows((prev) => prev.map((row) => (row.key === updated.key ? updated : row)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  const columns: DataListColumnDef<AiPromptTemplate>[] = useMemo(
    () => [
      {
        key: "title",
        label: he.aiPromptName,
        getValue: (row) => aiPromptLabel(row.key),
        renderCell: (row) => aiPromptLabel(row.key),
      },
      {
        key: "key",
        label: he.aiPromptKey,
        cellDir: "ltr",
        getValue: (row) => row.key,
        renderCell: (row) => row.key,
      },
      {
        key: "status",
        label: he.aiPromptStatus,
        getValue: (row) => (row.is_custom ? he.aiPromptCustom : he.aiPromptDefault),
        renderCell: (row) => (
          <Chip
            size="small"
            color={row.is_custom ? "warning" : "default"}
            label={row.is_custom ? he.aiPromptCustom : he.aiPromptDefault}
          />
        ),
      },
      {
        key: "version",
        label: he.aiPromptVersion,
        getValue: (row) => String(row.version),
        renderCell: (row) => `v${row.version}`,
      },
    ],
    [],
  );

  return (
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }}>
      <ListPageToolbar title={he.aiPromptsAdminTitle} subtitle={he.aiPromptsAdminSubtitle} />
      {error && !selected && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}
      <DataListTable
        viewKey="admin-ai-prompts"
        rows={rows}
        columns={columns}
        loading={loading}
        emptyMessage={he.aiPromptsEmpty}
        getRowId={(row) => row.key}
        renderActions={(row) => (
          <Tooltip title={he.aiPromptEdit}>
            <IconButton size="small" onClick={() => { setError(""); setSelected(row); }}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      />
      {selected && (
        <AiPromptEditDialog
          key={selected.key + selected.version}
          template={selected}
          saving={saving}
          error={error}
          onClose={() => setSelected(null)}
          onSave={saveBody}
          onReset={resetSelected}
        />
      )}
    </Box>
  );
}

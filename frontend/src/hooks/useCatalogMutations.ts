import { useState } from "react";
import { api, ApiError, type CatalogCourse } from "../api/client";
import { he } from "../i18n/he";
import {
  buildCatalogUpdatePayload,
  catalogEditMissing,
  catalogToEditForm,
  type CatalogEditForm,
} from "../utils/catalogForm";

function messageOf(error: unknown): string {
  return error instanceof ApiError ? error.message : he.errorGeneric;
}

async function runMutation(action: () => Promise<void>, onError: (message: string) => void, setBusy: (busy: boolean) => void) {
  setBusy(true);
  try {
    await action();
    return true;
  } catch (error) {
    onError(messageOf(error));
    return false;
  } finally {
    setBusy(false);
  }
}

function patchCatalog(id: number, form: CatalogEditForm): Promise<void> {
  const body = JSON.stringify(buildCatalogUpdatePayload(form));
  return api<void>(`/api/catalog-courses/${id}`, { method: "PATCH", body });
}

async function saveCatalog(
  editingId: number | null,
  form: CatalogEditForm | null,
  onError: (message: string) => void,
  setBusy: (busy: boolean) => void,
  closeEdit: () => void,
  onDone: () => Promise<void>,
) {
  if (editingId === null || !form || catalogEditMissing(form)) return;
  const ok = await runMutation(() => patchCatalog(editingId, form), onError, setBusy);
  if (!ok) return;
  closeEdit();
  await onDone();
}

async function removeCatalog(
  deleting: CatalogCourse | null,
  onError: (message: string) => void,
  setBusy: (busy: boolean) => void,
  closeDelete: () => void,
  onDone: () => Promise<void>,
) {
  if (!deleting) return;
  const ok = await runMutation(
    () => api<void>(`/api/catalog-courses/${deleting.id}`, { method: "DELETE" }),
    onError,
    setBusy,
  );
  if (!ok) return;
  closeDelete();
  await onDone();
}

/** Édition et suppression d'un cours catalogue. */
export function useCatalogMutations(onDone: () => Promise<void>, onError: (message: string) => void) {
  const [form, setForm] = useState<CatalogEditForm | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<CatalogCourse | null>(null);
  const [busy, setBusy] = useState(false);
  const closeEdit = () => { setEditingId(null); setForm(null); };
  const closeDelete = () => setDeleting(null);

  return {
    form, setForm, deleting, busy, missing: form ? catalogEditMissing(form) : null,
    openEdit: (catalog: CatalogCourse) => { setEditingId(catalog.id); setForm(catalogToEditForm(catalog)); },
    closeEdit, save: () => saveCatalog(editingId, form, onError, setBusy, closeEdit, onDone),
    askDelete: setDeleting, closeDelete,
    confirmDelete: () => removeCatalog(deleting, onError, setBusy, closeDelete, onDone),
  };
}

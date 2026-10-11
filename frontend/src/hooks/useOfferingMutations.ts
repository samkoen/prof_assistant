import { useState } from "react";
import { api, ApiError, type CourseOffering } from "../api/client";
import { he } from "../i18n/he";
import {
  buildOfferingUpdatePayload,
  offeringEditMissing,
  offeringToEditForm,
  type OfferingEditForm,
} from "../utils/offeringForm";

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

function patchOffering(id: number, form: OfferingEditForm): Promise<void> {
  const body = JSON.stringify(buildOfferingUpdatePayload(form));
  return api<void>(`/api/courses/${id}`, { method: "PATCH", body });
}

/** Édition et suppression d'une הרצה depuis « הקורסים שלי ». */
export function useOfferingMutations(onDone: () => Promise<void>, onError: (message: string) => void) {
  const [editing, setEditing] = useState<CourseOffering | null>(null);
  const [form, setForm] = useState<OfferingEditForm | null>(null);
  const [deleting, setDeleting] = useState<CourseOffering | null>(null);
  const [busy, setBusy] = useState(false);

  const openEdit = (offering: CourseOffering) => {
    setEditing(offering);
    setForm(offeringToEditForm(offering));
  };
  const save = async () => {
    if (!editing || !form || offeringEditMissing(form)) return;
    const ok = await runMutation(() => patchOffering(editing.id, form), onError, setBusy);
    if (!ok) return;
    setEditing(null);
    await onDone();
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    const ok = await runMutation(() => api<void>(`/api/courses/${deleting.id}`, { method: "DELETE" }), onError, setBusy);
    if (!ok) return;
    setDeleting(null);
    await onDone();
  };

  return {
    editing, form, setForm, deleting, busy, missing: form ? offeringEditMissing(form) : null,
    openEdit, closeEdit: () => setEditing(null), save, askDelete: setDeleting,
    closeDelete: () => setDeleting(null), confirmDelete,
  };
}

import { useState } from "react";
import { api, ApiError, type CatalogCourse } from "../api/client";
import { he } from "../i18n/he";
import {
  EMPTY_NEW_CATALOG,
  NEW_CATALOG_ID,
  buildCatalogPayload,
  buildOfferingPayload,
  emptyOfferingForm,
  isNewCatalog,
  offeringMissingField,
  type NewCatalogForm,
  type OfferingForm,
} from "../utils/offeringForm";

function messageOf(e: unknown): string {
  return e instanceof ApiError ? e.message : he.errorGeneric;
}

/** Création d'une instance de cours (groupe), avec création optionnelle du cours catalogue. */
export function useCreateOffering(onCreated: () => Promise<void>, onError: (message: string) => void) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<OfferingForm>(emptyOfferingForm());
  const [newCatalog, setNewCatalog] = useState<NewCatalogForm>(EMPTY_NEW_CATALOG);
  const [catalogs, setCatalogs] = useState<CatalogCourse[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const openDialog = async () => {
    setOpen(true);
    setNewCatalog(EMPTY_NEW_CATALOG);
    setLoadingCatalogs(true);
    try {
      const cats = await api<CatalogCourse[]>("/api/catalog-courses/mine");
      setCatalogs(cats);
      setForm({ ...emptyOfferingForm(), catalog_course_id: cats.length === 0 ? NEW_CATALOG_ID : "" });
    } catch (e) {
      onError(messageOf(e));
    } finally {
      setLoadingCatalogs(false);
    }
  };

  const close = () => setOpen(false);

  const resolveCatalogId = async (): Promise<number> => {
    if (!isNewCatalog(form)) return Number(form.catalog_course_id);
    const body = JSON.stringify(buildCatalogPayload(newCatalog));
    return (await api<CatalogCourse>("/api/catalog-courses", { method: "POST", body })).id;
  };

  const submit = async () => {
    const missing = offeringMissingField(form, newCatalog);
    if (missing) return onError(missing);
    setSubmitting(true);
    try {
      const body = JSON.stringify(buildOfferingPayload(form, await resolveCatalogId()));
      await api("/api/courses", { method: "POST", body });
      close();
      await onCreated();
    } catch (e) {
      onError(messageOf(e));
    } finally {
      setSubmitting(false);
    }
  };

  return {
    open, form, newCatalog, catalogs, loadingCatalogs, submitting,
    missing: offeringMissingField(form, newCatalog),
    setForm, setNewCatalog, openDialog, close, submit,
  };
}

export type CreateOfferingState = ReturnType<typeof useCreateOffering>;

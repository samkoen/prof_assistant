import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, ApiError, type CatalogCourse, type CourseOffering } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { he } from "../i18n/he";
import {
  EMPTY_EXAM_FORM,
  buildCreatePayload,
  editorPathAfterCreate,
  forceTirgoulForm,
  type ExamCreateForm,
} from "../utils/examCreatePayload";

type ExamCreateMode = { forceTirgoul?: boolean; editorBase?: string };

function readParams(params: URLSearchParams, fallback: string) {
  return {
    returnTo: params.get("return") || fallback,
    catalogId: params.get("catalog_course_id") || "",
    offeringId: params.get("offering_id") || "",
  };
}

function useCreateContext(offeringId: string, onError: (message: string) => void) {
  const [catalogs, setCatalogs] = useState<CatalogCourse[]>([]);
  const [offering, setOffering] = useState<CourseOffering | null>(null);
  useEffect(() => {
    Promise.all([api<CatalogCourse[]>("/api/catalog-courses/mine"), api<CourseOffering[]>("/api/courses/mine")])
      .then(([cats, offs]) => {
        setCatalogs(cats);
        if (offeringId) setOffering(offs.find((o) => o.id === Number(offeringId)) ?? null);
      })
      .catch(() => onError(he.errorGeneric));
  }, [offeringId, onError]);
  return { catalogs, offering };
}

async function sendCreatedExam(
  form: ExamCreateForm,
  offering: CourseOffering | null,
  userId: number | null,
  returnTo: string,
  editorBase: string,
  navigate: (path: string) => void,
  setError: (message: string) => void,
  setSaving: (value: boolean) => void,
) {
  setSaving(true);
  setError("");
  try {
    const body = buildCreatePayload(form, offering, userId);
    const exam = await api<{ id: number }>("/api/exams", { method: "POST", body: JSON.stringify(body) });
    navigate(editorPathAfterCreate(exam.id, returnTo, editorBase));
  } catch (e) {
    setError(e instanceof ApiError ? e.message : he.errorGeneric);
    setSaving(false);
  }
}

/** État et envoi du formulaire de création d'examen (contexte groupe/cours via l'URL). */
export function useExamCreate(mode: ExamCreateMode = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const editorBase = mode.editorBase ?? "/teacher/exams";
  const fallback = mode.forceTirgoul ? "/student/courses" : "/teacher/exams";
  const params = readParams(useSearchParams()[0], fallback);
  const initial: ExamCreateForm = {
    ...EMPTY_EXAM_FORM,
    catalog_course_id: params.catalogId,
    audience: "all",
    is_tirgoul: mode.forceTirgoul ? true : EMPTY_EXAM_FORM.is_tirgoul,
  };
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const { catalogs, offering } = useCreateContext(params.offeringId, setError);

  const submit = () => {
    if (!form.catalog_course_id) return setError(he.selectCatalogCourse);
    const payloadForm = mode.forceTirgoul ? forceTirgoulForm(form) : form;
    void sendCreatedExam(payloadForm, offering, user?.id ?? null, params.returnTo, editorBase, navigate, setError, setSaving);
  };

  const patch = (next: Partial<ExamCreateForm>) => setForm((f) => ({ ...f, ...next }));
  const reset = () => {
    setForm(initial);
    setError("");
  };

  return { form, patch, reset, submit, error, setError, saving, catalogs, offering, params };
}

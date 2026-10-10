import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, ApiError, type CatalogCourse, type CourseOffering } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { he } from "../i18n/he";
import {
  EMPTY_EXAM_FORM,
  buildCreatePayload,
  editorPathAfterCreate,
  type ExamCreateForm,
} from "../utils/examCreatePayload";

function readParams(params: URLSearchParams) {
  return {
    returnTo: params.get("return") || "/teacher/exams",
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

/** État et envoi du formulaire de création d'examen (contexte groupe/cours via l'URL). */
export function useExamCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = readParams(useSearchParams()[0]);
  const initial: ExamCreateForm = {
    ...EMPTY_EXAM_FORM,
    catalog_course_id: params.catalogId,
    audience: "all",
  };
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const { catalogs, offering } = useCreateContext(params.offeringId, setError);

  const submit = async () => {
    if (!form.catalog_course_id) return setError(he.selectCatalogCourse);
    setSaving(true);
    setError("");
    try {
      const body = buildCreatePayload(form, offering, user?.id ?? null);
      const exam = await api<{ id: number }>("/api/exams", { method: "POST", body: JSON.stringify(body) });
      navigate(editorPathAfterCreate(exam.id, params.returnTo));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
      setSaving(false);
    }
  };

  const patch = (next: Partial<ExamCreateForm>) => setForm((f) => ({ ...f, ...next }));
  const reset = () => {
    setForm(initial);
    setError("");
  };

  return { form, patch, reset, submit, error, setError, saving, catalogs, offering, params };
}

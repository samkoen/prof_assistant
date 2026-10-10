import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../api/client";
import { deleteGeminiSource, listGeminiSources, updateGeminiSource, uploadGeminiSource } from "../api/geminiSources";
import { he } from "../i18n/he";
import type { GeminiSource } from "../types/geminiSource";
import { flagsFromRoles, splitDroppedFiles, type SourceRole } from "../utils/geminiSourceRole";

type Options = {
  examId: number;
  onSourcesChange: (sources: GeminiSource[]) => void;
  onError: (message: string) => void;
};

/** Fichiers sources d'un examen : liste, dépôt multiple, rôle (contenu / style) et suppression. */
export function useGeminiSources({ examId, onSourcesChange, onError }: Options) {
  const [sources, setSources] = useState<GeminiSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const apply = useCallback(
    (list: GeminiSource[]) => {
      setSources(list);
      onSourcesChange(list);
    },
    [onSourcesChange],
  );

  const reload = useCallback(async () => {
    try {
      apply(await listGeminiSources(examId));
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [examId, apply, onError]);

  useEffect(() => {
    reload();
  }, [reload]);

  const upload = async (files: File[]) => {
    const { accepted, rejected } = splitDroppedFiles(files);
    onError(rejected.length ? `${he.geminiSourceUnsupported}: ${rejected.map((f) => f.name).join(", ")}` : "");
    if (accepted.length === 0) return;
    setUploading(true);
    try {
      for (const file of accepted) await uploadGeminiSource(examId, file, "course_file");
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      await reload();
      setUploading(false);
    }
  };

  const setRoles = async (src: GeminiSource, roles: SourceRole[]) => {
    const flags = flagsFromRoles(roles);
    if (!flags) return;
    onError("");
    try {
      const updated = await updateGeminiSource(src.id, flags);
      apply(sources.map((s) => (s.id === src.id ? updated : s)));
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
      await reload();
    }
  };

  const remove = async (src: GeminiSource) => {
    onError("");
    try {
      await deleteGeminiSource(src.id);
      await reload();
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    }
  };

  return { sources, loading, uploading, upload, setRoles, remove };
}

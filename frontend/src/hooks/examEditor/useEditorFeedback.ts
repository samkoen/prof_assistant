import { useState } from "react";

export interface EditorFeedback {
  error: string;
  success: string;
  setError: (message: string) => void;
  setSuccess: (message: string) => void;
}

/** Messages d'erreur / de succès affichés en haut de l'éditeur. */
export function useEditorFeedback(): EditorFeedback {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  return { error, success, setError, setSuccess };
}

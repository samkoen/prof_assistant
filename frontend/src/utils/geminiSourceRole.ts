import type { GeminiSource } from "../types/geminiSource";

/** Rôle d'un fichier source : base de contenu (ce qui a été enseigné) et/ou exemple de style. */
export type SourceRole = "content" | "style";

export const ACCEPTED_SOURCE_EXTENSIONS = [".pdf", ".txt", ".md"] as const;

export function rolesFromSource(src: Pick<GeminiSource, "use_as_style" | "use_as_content">): SourceRole[] {
  const roles: SourceRole[] = [];
  if (src.use_as_content) roles.push("content");
  if (src.use_as_style) roles.push("style");
  return roles;
}

/** Convertit une sélection de rôles en indicateurs API ; au moins un rôle doit rester actif. */
export function flagsFromRoles(roles: SourceRole[]): { use_as_content: boolean; use_as_style: boolean } | null {
  if (roles.length === 0) return null;
  return { use_as_content: roles.includes("content"), use_as_style: roles.includes("style") };
}

/** Bascule un rôle ; le dernier rôle actif ne peut pas être retiré (un fichier sert à quelque chose). */
export function toggleRole(current: SourceRole[], role: SourceRole): SourceRole[] {
  if (!current.includes(role)) return [...current, role];
  return current.length > 1 ? current.filter((r) => r !== role) : current;
}

export function isAcceptedSourceFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ACCEPTED_SOURCE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/** Sépare les fichiers déposés en acceptés / refusés selon leur extension. */
export function splitDroppedFiles(files: File[]): { accepted: File[]; rejected: File[] } {
  return {
    accepted: files.filter((f) => isAcceptedSourceFile(f.name)),
    rejected: files.filter((f) => !isAcceptedSourceFile(f.name)),
  };
}

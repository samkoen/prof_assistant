export type PracticeReleaseInput = {
  practice: boolean;
  status?: "draft" | "active" | "closed";
  gradingLocked?: boolean;
  hasContent: boolean;
};

export type PracticeReleaseActions = {
  /** Premier envoi aux élèves (brouillon avec contenu). */
  deploy: boolean;
  deployBlocked: boolean;
  /** La note est libre : on peut la bloquer. */
  block: boolean;
  /** La note est bloquée : on peut la rendre. */
  unlock: boolean;
};

const NONE: PracticeReleaseActions = { deploy: false, deployBlocked: false, block: false, unlock: false };

/** Actions prof : envoyer un תרגול / une משימה, puis bloquer ou rendre la note. */
export function practiceReleaseActions(input: PracticeReleaseInput): PracticeReleaseActions {
  if (!input.practice) return NONE;
  const draft = !input.status || input.status === "draft";
  const live = input.status === "active";
  const locked = input.gradingLocked === true;
  return {
    deploy: input.hasContent && draft,
    deployBlocked: draft && !input.hasContent,
    block: live && !locked,
    unlock: live && locked,
  };
}

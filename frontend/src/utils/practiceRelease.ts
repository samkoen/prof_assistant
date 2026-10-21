export type PracticeReleaseInput = {
  practice: boolean;
  status?: "draft" | "active" | "closed";
  gradingLocked?: boolean;
  hasContent: boolean;
};

export type PracticeReleaseActions = {
  deploy: boolean;
  deployBlocked: boolean;
  block: boolean;
};

/** Boutons prof : envoyer un תרגול / une משימה, ou bloquer la note. */
export function practiceReleaseActions(input: PracticeReleaseInput): PracticeReleaseActions {
  if (!input.practice) return { deploy: false, deployBlocked: false, block: false };
  const draft = !input.status || input.status === "draft";
  const locked = input.gradingLocked === true;
  return {
    deploy: input.hasContent && (draft || locked),
    deployBlocked: draft && !input.hasContent,
    block: input.status === "active" && !locked,
  };
}

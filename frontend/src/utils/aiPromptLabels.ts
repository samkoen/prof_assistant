import { he } from "../i18n/he";

const LABELS: Record<string, string> = {
  "output_language.he": he.aiPromptOutputLanguageHe,
  "output_language.fr": he.aiPromptOutputLanguageFr,
  "output_language.en": he.aiPromptOutputLanguageEn,
  "output_language.ru": he.aiPromptOutputLanguageRu,
  "open_eval.system": he.aiPromptOpenEvalSystem,
  "open_eval.strict_he": he.aiPromptOpenEvalStrictHe,
  "open_eval.user": he.aiPromptOpenEvalUser,
  "open_model.user": he.aiPromptOpenModelUser,
  "explanation.system": he.aiPromptExplanationSystem,
  "explanation.user": he.aiPromptExplanationUser,
  "generation.system": he.aiPromptGenerationSystem,
  "generation.mandatory": he.aiPromptGenerationMandatory,
  "generation.user": he.aiPromptGenerationUser,
  "generation.refine": he.aiPromptGenerationRefine,
  "generation.batch": he.aiPromptGenerationBatch,
  "generation.prior": he.aiPromptGenerationPrior,
  "generation.preview": he.aiPromptGenerationPreview,
  "generation.sources_intro": he.aiPromptGenerationSources,
};

export function aiPromptLabel(key: string): string {
  return LABELS[key] ?? key;
}

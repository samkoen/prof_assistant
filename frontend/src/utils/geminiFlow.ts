/** Étapes du parcours de génération AI : demande → revue → génération → validation. */
export type GeminiFlowStep = 0 | 1 | 2 | 3;

type FlowState = {
  /** L'écran « résumé avant création » est affiché. */
  previewStep: boolean;
  /** Une session de génération existe (en cours ou terminée). */
  generationStarted: boolean;
  /** La génération est terminée (ou des résultats / erreurs de format sont à valider). */
  generationComplete: boolean;
};

export function geminiFlowStep({ previewStep, generationStarted, generationComplete }: FlowState): GeminiFlowStep {
  if (generationStarted) return generationComplete ? 3 : 2;
  return previewStep ? 1 : 0;
}

type SourceFlags = { use_as_style: boolean; use_as_content: boolean };

export type RequestSummary = { questions: number; series: number; files: number; contentFiles: number; styleFiles: number };

/** Récapitulatif de la demande : questions, séries et fichiers joints. */
export function summarizeRequest(series: { questionCount: number }[], sources: SourceFlags[]): RequestSummary {
  return {
    questions: series.reduce((sum, s) => sum + s.questionCount, 0),
    series: series.length,
    files: sources.length,
    contentFiles: sources.filter((s) => s.use_as_content).length,
    styleFiles: sources.filter((s) => s.use_as_style).length,
  };
}

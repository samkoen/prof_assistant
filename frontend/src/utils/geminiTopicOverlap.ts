const STOP_WORDS = new Set([
  "של",
  "על",
  "את",
  "זה",
  "הוא",
  "היא",
  "הם",
  "או",
  "גם",
  "כל",
  "עם",
  "אם",
  "לא",
  "יש",
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "are",
  "was",
  "les",
  "des",
  "une",
  "pour",
  "dans",
]);

function tokenize(text: string): Set<string> {
  const tokens = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
  return new Set(tokens);
}

export function computeTopicOverlap(instructions: string[], questionTexts: string[]): number {
  const instructionTokens = new Set<string>();
  for (const line of instructions) {
    for (const token of tokenize(line)) {
      instructionTokens.add(token);
    }
  }
  if (instructionTokens.size === 0) {
    return 1;
  }
  const questionTokens = new Set<string>();
  for (const text of questionTexts) {
    for (const token of tokenize(text)) {
      questionTokens.add(token);
    }
  }
  let overlap = 0;
  for (const token of instructionTokens) {
    if (questionTokens.has(token)) {
      overlap += 1;
    }
  }
  return overlap / instructionTokens.size;
}

const LOW_OVERLAP_THRESHOLD = 0.15;

export function isLowTopicOverlap(instructions: string[], questionTexts: string[]): boolean {
  if (questionTexts.length === 0) {
    return false;
  }
  return computeTopicOverlap(instructions, questionTexts) < LOW_OVERLAP_THRESHOLD;
}

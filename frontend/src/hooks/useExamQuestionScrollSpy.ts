import { useEffect, useState } from "react";
import { examQuestionElementId } from "../utils/studentExamQuestionNav";

export function useExamQuestionScrollSpy(questionCount: number, enabled: boolean): number {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!enabled || questionCount <= 0) return;

    const elements = Array.from({ length: questionCount }, (_, i) =>
      document.getElementById(examQuestionElementId(i + 1)),
    ).filter((el): el is HTMLElement => el != null);

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!best) return;
        const idx = elements.indexOf(best.target as HTMLElement);
        if (idx >= 0) setActiveIndex(idx);
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: [0, 0.2, 0.5, 0.8] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [enabled, questionCount]);

  return activeIndex;
}

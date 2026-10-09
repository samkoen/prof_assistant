export interface BillingPackApi {
  code: string;
  product: string;
  credits: number;
  price_ils: number;
  label?: string;
}

export interface BillingSettingsApi {
  student_free_credits: number;
  teacher_free_credits: number;
  calls_per_teacher_credit: number;
  packs: BillingPackApi[];
}

export interface BillingPackDraft {
  code: string;
  product: string;
  credits: string;
  priceIls: string;
}

export interface BillingSettingsDraft {
  studentFree: string;
  teacherFree: string;
  callsPerCredit: string;
  packs: BillingPackDraft[];
}

function wholeNumber(raw: string, min: number): number | null {
  if (!/^\d+$/.test(raw.trim())) return null;
  const value = Number(raw);
  return value >= min ? value : null;
}

export function draftFromApi(data: BillingSettingsApi): BillingSettingsDraft {
  return {
    studentFree: String(data.student_free_credits),
    teacherFree: String(data.teacher_free_credits),
    callsPerCredit: String(data.calls_per_teacher_credit),
    packs: data.packs.map((pack) => ({
      code: pack.code,
      product: pack.product,
      credits: String(pack.credits),
      priceIls: String(pack.price_ils),
    })),
  };
}

export function payloadFromDraft(draft: BillingSettingsDraft): BillingSettingsApi | null {
  const studentFree = wholeNumber(draft.studentFree, 0);
  const teacherFree = wholeNumber(draft.teacherFree, 0);
  const calls = wholeNumber(draft.callsPerCredit, 1);
  if (studentFree === null || teacherFree === null || calls === null) return null;
  const packs = draft.packs.map((pack) => {
    const credits = wholeNumber(pack.credits, 1);
    const price = wholeNumber(pack.priceIls, 1);
    if (credits === null || price === null) return null;
    return { code: pack.code, product: pack.product, credits, price_ils: price };
  });
  if (packs.some((pack) => pack === null)) return null;
  return {
    student_free_credits: studentFree,
    teacher_free_credits: teacherFree,
    calls_per_teacher_credit: calls,
    packs: packs as BillingPackApi[],
  };
}

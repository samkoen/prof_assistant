import { describe, expect, it } from "vitest";
import { draftFromApi, payloadFromDraft, type BillingSettingsApi } from "../billingSettings";

const apiSettings: BillingSettingsApi = {
  student_free_credits: 5,
  teacher_free_credits: 3,
  calls_per_teacher_credit: 5,
  payment_enabled: false,
  packs: [{ code: "student_20", product: "student_ai", credits: 20, price_ils: 19 }],
};

describe("billingSettings", () => {
  it("reconstruit le corps d'enregistrement", () => {
    const body = payloadFromDraft(draftFromApi(apiSettings));
    expect(body?.student_free_credits).toBe(5);
    expect(body?.packs[0].price_ils).toBe(19);
  });

  it("conserve l'interrupteur de paiement (désactivé par défaut)", () => {
    const draft = draftFromApi(apiSettings);
    expect(draft.paymentEnabled).toBe(false);
    expect(payloadFromDraft(draft)?.payment_enabled).toBe(false);
    expect(payloadFromDraft({ ...draft, paymentEnabled: true })?.payment_enabled).toBe(true);
  });

  it("traite l'absence du champ comme désactivé", () => {
    const legacy = { ...apiSettings } as Partial<BillingSettingsApi>;
    delete legacy.payment_enabled;
    expect(draftFromApi(legacy as BillingSettingsApi).paymentEnabled).toBe(false);
  });

  it("refuse un prix vide ou nul", () => {
    const draft = draftFromApi(apiSettings);
    draft.packs[0].priceIls = "0";
    expect(payloadFromDraft(draft)).toBeNull();
    draft.callsPerCredit = "";
    expect(payloadFromDraft(draft)).toBeNull();
  });
});

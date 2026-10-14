import { he } from "../i18n/he";

/** Coordonnées publiques. Téléphone et adresse réels avant envoi du lien à PayMe. */
export const BUSINESS_EMAIL = "skoen7665210@gmail.com";
export const BUSINESS_PHONE = "055-9903822";
export const BUSINESS_ADDRESS = "טהון 16, ירושלים";

export const PUBLIC_OFFER_IDS = ["assignments", "exams", "explanations", "credits"] as const;

export type PublicOfferId = (typeof PUBLIC_OFFER_IDS)[number];

export type ContactKind = "address" | "phone" | "email";

export type BusinessInput = {
  email: string;
  phone: string;
  address: string;
};

export function publicOffers() {
  return PUBLIC_OFFER_IDS.map((id) => ({
    id,
    title: he.publicHome.offers[id].title,
    text: he.publicHome.offers[id].text,
  }));
}

export function businessContactLines(input: BusinessInput = {
  email: BUSINESS_EMAIL,
  phone: BUSINESS_PHONE,
  address: BUSINESS_ADDRESS,
}) {
  const rows: { kind: ContactKind; value: string }[] = [];
  pushContact(rows, "address", input.address);
  pushContact(rows, "phone", input.phone);
  pushContact(rows, "email", input.email);
  return rows;
}

function pushContact(rows: { kind: ContactKind; value: string }[], kind: ContactKind, value: string) {
  const trimmed = value.trim();
  if (trimmed) rows.push({ kind, value: trimmed });
}

export function nextDemoIndex(current: number, total: number): number {
  if (total <= 0) return 0;
  return (current + 1) % total;
}

export function contactHref(kind: ContactKind, value: string): string | undefined {
  if (kind === "email") return `mailto:${value}`;
  if (kind === "phone") return `tel:${value.replace(/[^\d+]/g, "")}`;
  return undefined;
}

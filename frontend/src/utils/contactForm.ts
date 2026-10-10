import { he } from "../i18n/he";

export const CONTACT_CATEGORIES = ["question", "bug", "billing", "suggestion", "other"] as const;
export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export const CONTACT_LIMITS = { subjectMin: 3, subjectMax: 120, messageMin: 10, messageMax: 4000 } as const;

export type ContactForm = { category: ContactCategory; subject: string; message: string };

/** Visiteur non connecté : nom + e-mail ; `website` est le piège à robots (toujours vide pour un humain). */
export type PublicContactForm = ContactForm & { name: string; email: string; website: string };

export const EMPTY_CONTACT_FORM: ContactForm = { category: "question", subject: "", message: "" };
export const EMPTY_PUBLIC_CONTACT_FORM: PublicContactForm = { ...EMPTY_CONTACT_FORM, name: "", email: "", website: "" };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function contactCategoryLabel(category: ContactCategory): string {
  return he.contactCategories[category];
}

/** Message d'erreur du premier champ invalide, ou null si le formulaire peut être envoyé. */
export function validateContactForm(form: ContactForm): string | null {
  const subject = form.subject.trim().length;
  const message = form.message.trim().length;
  if (subject < CONTACT_LIMITS.subjectMin) return he.contactSubjectTooShort;
  if (message < CONTACT_LIMITS.messageMin) return he.contactMessageTooShort;
  return null;
}

export function validatePublicContactForm(form: PublicContactForm): string | null {
  if (form.name.trim().length < 2) return he.contactNameTooShort;
  if (!EMAIL_RE.test(form.email.trim())) return he.contactEmailInvalid;
  return validateContactForm(form);
}

export function canSubmitContact(form: ContactForm): boolean {
  return validateContactForm(form) === null;
}

export function canSubmitPublicContact(form: PublicContactForm): boolean {
  return validatePublicContactForm(form) === null;
}

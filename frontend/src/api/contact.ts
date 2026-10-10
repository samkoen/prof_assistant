import { api } from "./client";
import type { ContactForm, PublicContactForm } from "../utils/contactForm";

function contactPayload(form: ContactForm) {
  return { category: form.category, subject: form.subject.trim(), message: form.message.trim() };
}

async function post(path: string, payload: unknown): Promise<void> {
  await api<{ sent: boolean }>(path, { method: "POST", body: JSON.stringify(payload) });
}

export function sendContactMessage(form: ContactForm): Promise<void> {
  return post("/api/contact", contactPayload(form));
}

export function sendPublicContactMessage(form: PublicContactForm): Promise<void> {
  return post("/api/contact/public", {
    ...contactPayload(form),
    name: form.name.trim(),
    email: form.email.trim(),
    website: form.website,
  });
}

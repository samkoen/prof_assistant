import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Link, Typography } from "@mui/material";
import { sendPublicContactMessage } from "../api/contact";
import { ApiError } from "../api/client";
import ContactForm from "../components/contact/ContactForm";
import ContactSent from "../components/contact/ContactSent";
import VisitorFields from "../components/contact/VisitorFields";
import AuthLayout from "../components/ui/AuthLayout";
import { he } from "../i18n/he";
import {
  canSubmitPublicContact,
  EMPTY_PUBLIC_CONTACT_FORM,
  validatePublicContactForm,
} from "../utils/contactForm";

/** « צור קשר » sans connexion : accessible depuis les pages de connexion et d'inscription. */
export default function PublicContactPage() {
  const [form, setForm] = useState(EMPTY_PUBLIC_CONTACT_FORM);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    const invalid = validatePublicContactForm(form);
    if (invalid) return setError(invalid);
    setSending(true);
    setError("");
    try {
      await sendPublicContactMessage(form);
      setSent(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthLayout title={he.contactTitle}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {he.contactSubtitle}
      </Typography>
      {sent ? (
        <ContactSent onAnother={() => { setForm(EMPTY_PUBLIC_CONTACT_FORM); setSent(false); }} />
      ) : (
        <ContactForm
          form={form}
          topFields={<VisitorFields form={form} onChange={setForm} />}
          error={error}
          sending={sending}
          canSend={canSubmitPublicContact(form)}
          onChange={setForm}
          onSend={send}
        />
      )}
      <Typography variant="body2" sx={{ mt: 3, textAlign: "center" }}>
        <Link component={RouterLink} to="/login" fontWeight={700}>
          {he.contactBackToLogin}
        </Link>
      </Typography>
    </AuthLayout>
  );
}

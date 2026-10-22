import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Box } from "@mui/material";
import { sendContactMessage } from "../api/contact";
import { ApiError } from "../api/client";
import ContactForm from "../components/contact/ContactForm";
import ContactSent from "../components/contact/ContactSent";
import ListPageToolbar from "../components/ListPageToolbar";
import { useAuth } from "../context/AuthContext";
import { he } from "../i18n/he";
import { canSubmitContact, closureContactForm, EMPTY_CONTACT_FORM, validateContactForm } from "../utils/contactForm";

/** « צור קשר » : le message part par e-mail vers l'équipe, avec l'adresse du compte en reply-to. */
export default function ContactPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [form, setForm] = useState(() => (params.get("topic") === "close" ? closureContactForm() : EMPTY_CONTACT_FORM));
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    const invalid = validateContactForm(form);
    if (invalid) return setError(invalid);
    setSending(true);
    setError("");
    try {
      await sendContactMessage(form);
      setSent(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setSending(false);
    }
  };

  const another = () => {
    setForm(EMPTY_CONTACT_FORM);
    setSent(false);
  };

  return (
    <Box dir="rtl">
      <ListPageToolbar title={he.contactTitle} subtitle={he.contactSubtitle} />
      {sent ? (
        <ContactSent onAnother={another} />
      ) : (
        <ContactForm
          form={form}
          email={user?.email ?? ""}
          error={error}
          sending={sending}
          canSend={canSubmitContact(form)}
          onChange={setForm}
          onSend={send}
        />
      )}
    </Box>
  );
}

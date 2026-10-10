import type { ReactNode } from "react";
import { Alert, Box, MenuItem, TextField, Typography } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import BidiTextField from "../BidiTextField";
import LoadingButton from "../ui/LoadingButton";
import { he } from "../../i18n/he";
import {
  CONTACT_CATEGORIES,
  CONTACT_LIMITS,
  contactCategoryLabel,
  type ContactForm as ContactFormValue,
} from "../../utils/contactForm";

type ContactFormProps<T extends ContactFormValue> = {
  form: T;
  /** Adresse de réponse affichée (utilisateur connecté). */
  email?: string;
  /** Champs supplémentaires au-dessus du formulaire (nom + e-mail du visiteur). */
  topFields?: ReactNode;
  error: string;
  sending: boolean;
  canSend: boolean;
  onChange: (next: T) => void;
  onSend: () => void;
};

type FieldProps<T extends ContactFormValue> = Pick<ContactFormProps<T>, "form" | "onChange">;

function CategoryField<T extends ContactFormValue>({ form, onChange }: FieldProps<T>) {
  return (
    <TextField
      select
      label={he.contactCategoryLabel}
      value={form.category}
      onChange={(e) => onChange({ ...form, category: e.target.value as ContactFormValue["category"] })}
      fullWidth
    >
      {CONTACT_CATEGORIES.map((category) => (
        <MenuItem key={category} value={category}>
          {contactCategoryLabel(category)}
        </MenuItem>
      ))}
    </TextField>
  );
}

function MessageField<T extends ContactFormValue>({ form, onChange }: FieldProps<T>) {
  return (
    <BidiTextField
      label={he.contactMessageLabel}
      placeholder={he.contactMessagePlaceholder}
      value={form.message}
      onChange={(e) => onChange({ ...form, message: e.target.value })}
      multiline
      minRows={6}
      maxRows={14}
      fullWidth
      required
      helperText={he.contactCounter(form.message.length, CONTACT_LIMITS.messageMax)}
      slotProps={{ htmlInput: { maxLength: CONTACT_LIMITS.messageMax } }}
    />
  );
}

/** Formulaire « צור קשר » : sujet, titre et message ; la réponse part vers l'e-mail de l'expéditeur. */
export default function ContactForm<T extends ContactFormValue>(props: ContactFormProps<T>) {
  const { form, email, topFields, error, sending, canSend, onChange, onSend } = props;
  return (
    <Box dir="rtl" sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 640 }}>
      {error && <Alert severity="error">{error}</Alert>}
      {topFields}
      <CategoryField form={form} onChange={onChange} />
      <BidiTextField
        label={he.contactSubjectLabel}
        value={form.subject}
        onChange={(e) => onChange({ ...form, subject: e.target.value })}
        slotProps={{ htmlInput: { maxLength: CONTACT_LIMITS.subjectMax } }}
        fullWidth
        required
      />
      <MessageField form={form} onChange={onChange} />
      {email && (
        <Typography variant="caption" color="text.secondary">
          {he.contactReplyTo}: <bdi dir="ltr">{email}</bdi>
        </Typography>
      )}
      <LoadingButton
        variant="contained"
        size="large"
        startIcon={<SendIcon sx={{ transform: "scaleX(-1)" }} />}
        loading={sending}
        disabled={!canSend}
        onClick={onSend}
        sx={{ alignSelf: "flex-start" }}
      >
        {he.contactSend}
      </LoadingButton>
    </Box>
  );
}

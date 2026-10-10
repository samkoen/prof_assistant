import { Box, TextField } from "@mui/material";
import BidiTextField from "../BidiTextField";
import { he } from "../../i18n/he";
import type { PublicContactForm } from "../../utils/contactForm";

type VisitorFieldsProps = { form: PublicContactForm; onChange: (next: PublicContactForm) => void };

const honeypotSx = { position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" } as const;

/** Nom + e-mail du visiteur, et un champ invisible : seuls les robots le remplissent. */
export default function VisitorFields({ form, onChange }: VisitorFieldsProps) {
  return (
    <>
      <BidiTextField
        label={he.contactNameLabel}
        value={form.name}
        onChange={(e) => onChange({ ...form, name: e.target.value })}
        autoComplete="name"
        fullWidth
        required
      />
      <TextField
        label={he.contactEmailLabel}
        type="email"
        value={form.email}
        onChange={(e) => onChange({ ...form, email: e.target.value })}
        autoComplete="email"
        dir="ltr"
        data-bidi="off"
        slotProps={{ htmlInput: { dir: "ltr", maxLength: 254 } }}
        fullWidth
        required
      />
      <Box aria-hidden sx={honeypotSx}>
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => onChange({ ...form, website: e.target.value })}
        />
      </Box>
    </>
  );
}

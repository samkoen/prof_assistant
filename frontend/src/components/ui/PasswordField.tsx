import { useState } from "react";
import { IconButton, InputAdornment, TextField, type TextFieldProps } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { he } from "../../i18n/he";

type PasswordFieldProps = Omit<TextFieldProps, "type">;

export default function PasswordField({ slotProps, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputSlot = typeof slotProps?.input === "object" ? slotProps.input : {};
  const htmlInputSlot = typeof slotProps?.htmlInput === "object" ? slotProps.htmlInput : {};

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      dir="ltr"
      slotProps={{
        ...slotProps,
        htmlInput: { ...htmlInputSlot, dir: "ltr" },
        input: {
          ...inputSlot,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                size="small"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? he.hidePassword : he.showPassword}
              >
                {visible ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

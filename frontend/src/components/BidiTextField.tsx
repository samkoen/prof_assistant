import type { MutableRefObject } from "react";
import TextField from "@mui/material/TextField";
import type { TextFieldProps } from "@mui/material";
import { useBidiTextField } from "../hooks/useBidiTextField";
import { he } from "../i18n/he";
import type { TextDirection } from "../utils/textDirectionShortcut";

type BidiTextFieldProps = TextFieldProps & {
  defaultDirection?: TextDirection;
  showDirectionHint?: boolean;
};

export default function BidiTextField({
  defaultDirection = "rtl",
  showDirectionHint = false,
  helperText,
  slotProps,
  inputRef: inputRefProp,
  ...rest
}: BidiTextFieldProps) {
  const { direction, inputRef, onKeyDown, slotProps: bidiSlotProps } = useBidiTextField(defaultDirection);
  const hint = showDirectionHint ? he.textDirectionHint : undefined;
  const mergedHelper =
    hint && helperText ? (
      <>
        {helperText}
        <br />
        {hint}
      </>
    ) : (
      (helperText ?? hint)
    );

  const mergeRef = (el: HTMLInputElement | HTMLTextAreaElement | null) => {
    (inputRef as MutableRefObject<typeof el>).current = el;
    if (typeof inputRefProp === "function") inputRefProp(el);
    else if (inputRefProp && "current" in inputRefProp) {
      (inputRefProp as MutableRefObject<typeof el>).current = el;
    }
  };

  return (
    <TextField
      {...rest}
      dir={direction}
      onKeyDown={onKeyDown}
      inputRef={mergeRef}
      slotProps={{
        ...slotProps,
        input: { ...slotProps?.input, ...bidiSlotProps.input },
        htmlInput: { ...slotProps?.htmlInput, ...bidiSlotProps.htmlInput },
      }}
      helperText={mergedHelper}
    />
  );
}

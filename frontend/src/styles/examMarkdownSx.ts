import type { SxProps, Theme } from "@mui/material";

export function examMarkdownSx(dir: "ltr" | "rtl"): SxProps<Theme> {
  return {
    wordBreak: "break-word",
    typography: "body2",
    direction: dir,
    textAlign: "start",
    "& p": { margin: "0 0 0.75em" },
    "& p:last-child": { mb: 0 },
    "& strong": { fontWeight: 700 },
    "& em": { fontStyle: "italic" },
    "& code": {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: "0.9em",
      bgcolor: "action.hover",
      borderRadius: 0.5,
      px: 0.5,
    },
    "& ul, & ol": { margin: "0.5em 0", paddingInlineStart: "1.25em" },
    "& li": { mb: 0.25 },
    "& li:last-child": { mb: 0 },
    "& pre": { margin: 0 },
  };
}

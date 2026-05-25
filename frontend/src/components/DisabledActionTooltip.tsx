import { cloneElement, isValidElement, type ReactElement } from "react";
import { Box, Tooltip } from "@mui/material";

type DisabledChildProps = { disabled?: boolean };

type Props = {
  disabled: boolean;
  disabledReason?: string;
  children: ReactElement<DisabledChildProps>;
};

const wrapSx = {
  display: "inline-flex",
  maxWidth: "100%",
  "& .MuiButton-root.Mui-disabled, & .MuiIconButton-root.Mui-disabled": {
    color: "action.disabled",
    borderColor: "action.disabled",
    bgcolor: "action.hover",
  },
};

export default function DisabledActionTooltip({ disabled, disabledReason, children }: Props) {
  if (!isValidElement(children)) return children;
  const forbidden = disabled && !!disabledReason;
  const child = cloneElement(children, { disabled });
  if (!forbidden) return child;
  return (
    <Tooltip title={disabledReason} arrow placement="top">
      <Box component="span" sx={wrapSx}>
        {child}
      </Box>
    </Tooltip>
  );
}

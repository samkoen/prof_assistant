import { cloneElement, isValidElement, type ReactElement } from "react";
import { Box, Tooltip } from "@mui/material";

type DisabledChildProps = { disabled?: boolean };

type Props = {
  disabled: boolean;
  disabledReason?: string;
  /** Libellé au survol quand l’action est disponible. */
  title?: string;
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

export default function DisabledActionTooltip({
  disabled,
  disabledReason,
  title,
  children,
}: Props) {
  if (!isValidElement(children)) return children;
  const child = cloneElement(children, { disabled });
  const tooltipTitle =
    disabled && disabledReason ? disabledReason : title ?? disabledReason;
  if (!tooltipTitle) {
    return disabled ? (
      <Box component="span" sx={wrapSx}>
        {child}
      </Box>
    ) : (
      child
    );
  }
  return (
    <Tooltip title={tooltipTitle} arrow placement="top">
      <Box component="span" sx={wrapSx}>
        {child}
      </Box>
    </Tooltip>
  );
}

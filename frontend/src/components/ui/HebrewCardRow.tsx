import { forwardRef, type KeyboardEvent, type ReactNode } from "react";
import { Box, Card, CardContent } from "@mui/material";
import {
  hebrewActionsLeftSx,
  hebrewCardRowSx,
  hebrewExamListTextBlockSx,
  hebrewTextBlockSx,
} from "../../styles/hebrewAlign";

type HebrewCardRowProps = {
  text: ReactNode;
  actions: ReactNode;
  /** Liste examens : texte en ligne horizontale aligné à droite. */
  examList?: boolean;
  id?: string;
  sx?: object;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
};

/** Fiche : icônes à gauche physique, texte hébreu à droite. */
const HebrewCardRow = forwardRef<HTMLDivElement, HebrewCardRowProps>(function HebrewCardRow(
  { text, actions, examList, id, sx, onClick, disabled = false, ariaLabel },
  ref,
) {
  const textSx = examList ? hebrewExamListTextBlockSx : hebrewTextBlockSx;
  const clickable = Boolean(onClick) && !disabled;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!clickable || !onClick) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      ref={ref}
      id={id}
      role={onClick ? "button" : undefined}
      tabIndex={clickable ? 0 : onClick ? -1 : undefined}
      aria-label={ariaLabel}
      aria-disabled={onClick ? disabled : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      sx={{
        overflow: "visible",
        ...(onClick && {
          cursor: disabled ? "not-allowed" : "pointer",
          ...(clickable && {
            "&:hover": { bgcolor: "action.hover" },
          }),
        }),
        ...sx,
      }}
    >
      <CardContent
        sx={{
          ...hebrewCardRowSx,
          px: 2,
          py: 2,
          paddingInlineEnd: 1.25,
          "&:last-child": { pb: 2 },
          ...(clickable && { pointerEvents: "none" }),
        }}
      >
        <Box sx={textSx}>{text}</Box>
        <Box sx={hebrewActionsLeftSx}>{actions}</Box>
      </CardContent>
    </Card>
  );
});

export default HebrewCardRow;

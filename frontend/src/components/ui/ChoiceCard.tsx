import { alpha, Box, ButtonBase, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { brand } from "../../theme/brand";

type ChoiceCardProps = {
  title: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
};

/** Choix exclusif présenté en carte : plus lisible et plus large à cliquer qu'un bouton radio. */
export default function ChoiceCard({ title, description, selected, onSelect, disabled }: ChoiceCardProps) {
  return (
    <ButtonBase
      role="radio"
      aria-checked={selected}
      aria-label={title}
      disabled={disabled}
      onClick={onSelect}
      sx={{
        flex: "1 1 220px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        gap: 1.25,
        p: 2,
        textAlign: "right",
        borderRadius: 2,
        border: `1.5px solid ${selected ? brand.primary600 : brand.slate200}`,
        bgcolor: selected ? alpha(brand.primary600, 0.05) : brand.white,
        transition: "border-color 0.15s ease, background-color 0.15s ease",
        "&:hover": { borderColor: selected ? brand.primary600 : brand.primary400 },
      }}
    >
      {selected ? <CheckCircleIcon sx={{ color: brand.primary600 }} /> : <RadioButtonUncheckedIcon sx={{ color: brand.slate400 }} />}
      <Box>
        <Typography fontWeight={600}>{title}</Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </Box>
    </ButtonBase>
  );
}

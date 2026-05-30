import { Box } from "@mui/material";

type HebrewCountPhraseProps = {
  label: string;
  count: number | string;
};

/** Libellé hébreu puis nombre à sa droite (ex. « שאלות במבחן 3 »). */
export default function HebrewCountPhrase({ label, count }: HebrewCountPhraseProps) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        flexDirection: "row",
        direction: "ltr",
        alignItems: "baseline",
        gap: 0.5,
      }}
    >
      <Box component="span" dir="rtl">
        {label}
      </Box>
      <Box component="span" dir="ltr">
        {count}
      </Box>
    </Box>
  );
}

import { Link } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

type SectionHeaderProps = {
  title: string;
  linkLabel?: string;
  linkTo?: string;
};

/** Titre de section avec lien « voir tout » du côté opposé. */
export default function SectionHeader({ title, linkLabel, linkTo }: SectionHeaderProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
      <Typography variant="h6" fontWeight={800}>
        {title}
      </Typography>
      {linkLabel && linkTo && (
        <Button component={Link} to={linkTo} size="small" endIcon={<ArrowBackIcon fontSize="small" />}>
          {linkLabel}
        </Button>
      )}
    </Box>
  );
}

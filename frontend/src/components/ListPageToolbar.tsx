import { Box, Button, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

interface ListPageToolbarProps {
  title: string;
  subtitle?: string;
  addLabel?: string;
  onAdd?: () => void;
}

/**
 * RTL : le bouton est en premier dans le DOM → côté gauche (loin du menu à droite).
 * Même logique que digestic, adapté à l’hébreu.
 */
export default function ListPageToolbar({ title, subtitle, addLabel, onAdd }: ListPageToolbarProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        mb: 3,
        width: "100%",
        flexDirection: "row",
      }}
    >
      {addLabel && onAdd && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onAdd}
          sx={{ flexShrink: 0, order: 0 }}
        >
          {addLabel}
        </Button>
      )}
      <Box sx={{ flex: 1, minWidth: 0, textAlign: "start", order: 1 }}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

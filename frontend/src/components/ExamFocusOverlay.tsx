import { Box, Typography } from "@mui/material";
import { he } from "../i18n/he";

export default function ExamFocusOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1400,
        bgcolor: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      <Typography variant="h5" color="common.white" textAlign="center" fontWeight={700}>
        {he.focusLeaveWarning}
      </Typography>
    </Box>
  );
}

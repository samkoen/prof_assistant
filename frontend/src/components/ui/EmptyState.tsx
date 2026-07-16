import type { ReactNode } from "react";
import { alpha, Box, Typography } from "@mui/material";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import { brand } from "../../theme/brand";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
};

export default function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <Box
      dir="rtl"
      sx={{
        textAlign: "center",
        py: { xs: 4, sm: 5 },
        px: 2,
        borderRadius: 3,
        border: `1px dashed ${alpha(brand.violet600, 0.22)}`,
        bgcolor: alpha(brand.violet600, 0.03),
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          mx: "auto",
          mb: 1.5,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: alpha(brand.violet600, 0.1),
          color: brand.violet600,
          "& .MuiSvgIcon-root": { fontSize: 28 },
        }}
      >
        {icon ?? <InboxOutlinedIcon />}
      </Box>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: action ? 2 : 0, maxWidth: 360, mx: "auto" }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}

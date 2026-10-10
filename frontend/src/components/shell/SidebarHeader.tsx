import { alpha, Box, IconButton } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import BrandMark from "../ui/BrandMark";
import { he } from "../../i18n/he";
import { brand } from "../../theme/brand";

const headerSx = {
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 1,
  px: 2.5,
  py: 2.25,
  borderBottom: `1px solid ${alpha(brand.white, 0.1)}`,
} as const;

const hideButtonSx = {
  flexShrink: 0,
  color: alpha(brand.white, 0.8),
  bgcolor: alpha(brand.white, 0.08),
  "&:hover": { bgcolor: alpha(brand.white, 0.16) },
} as const;

export default function SidebarHeader({ onHideSidebar }: { onHideSidebar?: () => void }) {
  return (
    <Box sx={headerSx}>
      <BrandMark size="sm" align="start" inverted />
      {onHideSidebar && (
        <IconButton size="small" onClick={onHideSidebar} aria-label={he.hideSidebar} sx={hideButtonSx}>
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
}

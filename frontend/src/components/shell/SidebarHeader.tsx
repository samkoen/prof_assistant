import { Box, IconButton, Tooltip } from "@mui/material";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import BrandMark from "../ui/BrandMark";
import { he } from "../../i18n/he";
import { brand } from "../../theme/brand";

const headerSx = {
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 1,
  px: 2.25,
  minHeight: 60,
} as const;

export default function SidebarHeader({ onHideSidebar }: { onHideSidebar?: () => void }) {
  return (
    <Box sx={headerSx}>
      <BrandMark size="sm" align="start" />
      {onHideSidebar && (
        <Tooltip title={he.hideSidebar}>
          <IconButton size="small" onClick={onHideSidebar} aria-label={he.hideSidebar} sx={{ color: brand.slate400 }}>
            <KeyboardDoubleArrowRightIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

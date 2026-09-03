import { Box } from "@mui/material";
import BrandSpinner from "./BrandSpinner";

type BrandPageLoaderProps = {
  fullScreen?: boolean;
};

export default function BrandPageLoader({ fullScreen = false }: BrandPageLoaderProps) {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight={fullScreen ? "100vh" : 168}
      py={fullScreen ? 0 : 6}
    >
      <BrandSpinner size={fullScreen ? 64 : 52} />
    </Box>
  );
}

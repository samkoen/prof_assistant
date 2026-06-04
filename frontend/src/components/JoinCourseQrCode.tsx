import { Box } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";

interface JoinCourseQrCodeProps {
  url: string;
  size?: number;
}

export default function JoinCourseQrCode({ url, size = 168 }: JoinCourseQrCodeProps) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        p: 1.5,
        bgcolor: "#fff",
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <QRCodeSVG value={url} size={size} level="M" marginSize={1} />
    </Box>
  );
}

import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Html5Qrcode } from "html5-qrcode";
import { he } from "../i18n/he";
import { joinRedirectPath, parseJoinTargetFromQrPayload } from "../utils/joinCourse";

interface JoinCourseQrScannerDialogProps {
  open: boolean;
  onClose: () => void;
}

function navigateFromScan(
  payload: string,
  navigate: ReturnType<typeof useNavigate>,
  onClose: () => void,
  setError: (msg: string) => void,
  handled: React.MutableRefObject<boolean>,
) {
  if (handled.current) return;
  const target = parseJoinTargetFromQrPayload(payload);
  if (!target) {
    setError(he.scanJoinQrInvalid);
    return;
  }
  handled.current = true;
  onClose();
  if (target.kind === "token") {
    navigate(joinRedirectPath(target.token));
    return;
  }
  navigate(`/join/${target.offeringId}`);
}

export default function JoinCourseQrScannerDialog({ open, onClose }: JoinCourseQrScannerDialogProps) {
  const navigate = useNavigate();
  const readerId = useId().replace(/:/g, "");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);
  const [error, setError] = useState("");
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    if (!open) return;
    handledRef.current = false;
    setError("");
    setUnsupported(false);

    const scanner = new Html5Qrcode(readerId);
    scannerRef.current = scanner;

    const onScan = (decoded: string) => {
      navigateFromScan(decoded, navigate, onClose, setError, handledRef);
    };

    const config = { fps: 8, qrbox: { width: 240, height: 240 } as const };
    scanner
      .start({ facingMode: "environment" }, config, onScan, () => undefined)
      .catch(() =>
        Html5Qrcode.getCameras()
          .then((cameras) => {
            const cameraId = cameras.at(-1)?.id ?? cameras[0]?.id;
            if (!cameraId) throw new Error("no camera");
            return scanner.start(cameraId, config, onScan, () => undefined);
          })
          .catch(() => setUnsupported(true)),
      );

    return () => {
      const s = scannerRef.current;
      scannerRef.current = null;
      if (!s) return;
      s.stop()
        .then(() => s.clear())
        .catch(() => undefined);
    };
  }, [open, readerId, navigate, onClose]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth dir="rtl">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {he.scanJoinQr}
        <IconButton onClick={onClose} aria-label={he.closeDialog}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {he.scanJoinQrHint}
        </Typography>
        {unsupported && <Alert severity="warning">{he.scanJoinQrUnsupported}</Alert>}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        <Box
          id={readerId}
          sx={{
            width: "100%",
            minHeight: 280,
            borderRadius: 1,
            overflow: "hidden",
            bgcolor: "grey.900",
            display: unsupported ? "none" : "block",
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

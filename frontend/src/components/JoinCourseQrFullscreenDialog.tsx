import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import JoinCourseQrCode from "./JoinCourseQrCode";
import { he } from "../i18n/he";

interface JoinCourseQrFullscreenDialogProps {
  open: boolean;
  joinUrl: string;
  title?: string;
  onClose: () => void;
}

export default function JoinCourseQrFullscreenDialog({
  open,
  joinUrl,
  title,
  onClose,
}: JoinCourseQrFullscreenDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth dir="rtl">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {he.joinQrFullscreenTitle}
        <IconButton onClick={onClose} aria-label={he.closeDialog}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ textAlign: "center", pb: 4 }}>
        {title && (
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            {title}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {he.joinQrHint}
        </Typography>
        <JoinCourseQrCode url={joinUrl} size={280} />
      </DialogContent>
    </Dialog>
  );
}

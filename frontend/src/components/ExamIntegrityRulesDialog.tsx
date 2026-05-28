import { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import DisabledActionTooltip from "./DisabledActionTooltip";
import { he } from "../i18n/he";

type Props = {
  open: boolean;
  examTitle: string;
  loading: boolean;
  onAccept: () => void;
};

export default function ExamIntegrityRulesDialog({ open, examTitle, loading, onAccept }: Props) {
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (open) setAgreed(false);
  }, [open]);

  return (
    <Dialog open={open} fullWidth maxWidth="sm" disableEscapeKeyDown>
      <DialogTitle>{he.examRulesTitle}</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {examTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {he.examRulesIntro}
        </Typography>
        <List dense disablePadding>
          {[he.examRuleStayOnTab, he.examRuleNoAi, he.examRuleNoHelp, he.examRuleRecorded].map(
            (text) => (
              <ListItem key={text} disablePadding sx={{ py: 0.5 }}>
                <ListItemText primary={text} />
              </ListItem>
            )
          )}
        </List>
        <FormControlLabel
          control={<Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />}
          label={he.examRulesAccept}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <DisabledActionTooltip
          disabled={!agreed || loading}
          disabledReason={!agreed ? he.mustAcceptExamRules : undefined}
        >
          <Button variant="contained" onClick={onAccept}>
            {loading ? he.loading : he.startExamAfterRules}
          </Button>
        </DisabledActionTooltip>
      </DialogActions>
    </Dialog>
  );
}

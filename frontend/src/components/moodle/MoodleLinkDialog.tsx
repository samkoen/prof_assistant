import { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from "@mui/material";
import { offeringLabel, type CourseOffering } from "../../api/client";
import type { MoodleCourseItem } from "../../api/moodle";
import { he } from "../../i18n/he";

interface Props {
  course: MoodleCourseItem | null;
  offerings: CourseOffering[];
  busy: boolean;
  onClose: () => void;
  onLink: (offeringId: number) => void;
}

export default function MoodleLinkDialog({ course, offerings, busy, onClose, onLink }: Props) {
  const [offeringId, setOfferingId] = useState<number | "">("");
  useEffect(() => {
    setOfferingId("");
  }, [course?.id]);
  return (
    <Dialog open={course !== null} onClose={onClose} fullWidth maxWidth="sm" dir="rtl">
      <DialogTitle>{he.moodleLinkExisting}</DialogTitle>
      <DialogContent>
        <TextField select fullWidth label={he.moodleSelectOffering} value={offeringId} onChange={(event) => setOfferingId(Number(event.target.value))} sx={{ mt: 1 }}>
          {offerings.map((offering) => (
            <MenuItem key={offering.id} value={offering.id}>{offeringLabel(offering)}</MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{he.cancel}</Button>
        <Button variant="contained" disabled={busy || offeringId === ""} onClick={() => offeringId !== "" && onLink(offeringId)}>
          {he.moodleLinkAction}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

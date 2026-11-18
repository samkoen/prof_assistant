import { useState } from "react";
import { Button } from "@mui/material";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import AiTutorDrawer from "./AiTutorDrawer";
import { he } from "../../i18n/he";

interface AiTutorButtonProps {
  sessionId: number;
  questionId: number;
  questionIndex: number;
  isCorrect: boolean | null;
  forPractice: boolean;
  /** Faux : seulement l'explication, sans chat (réglage du prof). */
  chatEnabled: boolean;
  dir: "rtl" | "ltr";
}

/** Seule entrée IA d'une question de la correction : ouvre le tuteur, ou l'explication seule si le chat est désactivé. */
export default function AiTutorButton(props: AiTutorButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="contained" size="small" disableElevation startIcon={<ForumOutlinedIcon />} onClick={() => setOpen(true)} sx={{ mt: 2 }}>
        {he.tutorOpen}
      </Button>
      {open && (
        <AiTutorDrawer
          open={open}
          onClose={() => setOpen(false)}
          sessionId={props.sessionId}
          questionId={props.questionId}
          questionLabel={he.tutorQuestionLabel(props.questionIndex)}
          isCorrect={props.isCorrect}
          forPractice={props.forPractice}
          chatEnabled={props.chatEnabled}
          dir={props.dir}
        />
      )}
    </>
  );
}

import { useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";
import AiExplanationMarkdown from "../AiExplanationMarkdown";
import Spinner from "../ui/Spinner";
import type { TutorMessage } from "../../api/aiTutor";
import { he } from "../../i18n/he";
import { brand, surface } from "../../theme/brand";

interface TutorMessageListProps {
  messages: TutorMessage[];
  pending: string | null;
  dir: "rtl" | "ltr";
}

function Bubble({ role, content, dir }: { role: TutorMessage["role"]; content: string; dir: "rtl" | "ltr" }) {
  const mine = role === "user";
  return (
    <Box
      dir={dir}
      sx={{
        alignSelf: mine ? "flex-start" : "flex-end",
        maxWidth: "88%",
        px: 1.5,
        py: 1,
        borderRadius: 2,
        bgcolor: mine ? brand.primary50 : "background.paper",
        border: `1px solid ${surface.border}`,
        textAlign: "start",
        unicodeBidi: "isolate",
      }}
    >
      {mine ? (
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
          {content}
        </Typography>
      ) : (
        <AiExplanationMarkdown content={content} dir={dir} />
      )}
    </Box>
  );
}

/** Fil de la conversation ; défile vers le dernier message. En RTL, l'élève est à droite. */
export default function TutorMessageList({ messages, pending, dir }: TutorMessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [messages.length, pending]);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      {messages.length === 0 && !pending && (
        <Typography variant="body2" color="text.secondary">
          {he.tutorIntro}
        </Typography>
      )}
      {messages.map((m) => (
        <Bubble key={m.id} role={m.role} content={m.content} dir={dir} />
      ))}
      {pending && (
        <>
          <Bubble role="user" content={pending} dir={dir} />
          <Box sx={{ alignSelf: "flex-end", display: "flex", alignItems: "center", gap: 1 }}>
            <Spinner size={16} />
            <Typography variant="caption" color="text.secondary">
              {he.tutorThinking}
            </Typography>
          </Box>
        </>
      )}
      <div ref={endRef} />
    </Box>
  );
}

import { Alert, Box, Button, TextField } from "@mui/material";
import { he } from "../../i18n/he";
import type { useMoodleConnection } from "../../hooks/useMoodleConnection";

type Connection = ReturnType<typeof useMoodleConnection>;

export default function MoodleConnectionCard({ connection }: { connection: Connection }) {
  const connected = connection.status?.connected === true;
  return (
    <Box component="form" dir="rtl" onSubmit={(event) => { event.preventDefault(); void connection.save(); }} sx={{ display: "grid", gap: 2, mb: 3, maxWidth: 560 }}>
      {connected && <Alert severity="success">{he.moodleConnected}</Alert>}
      {!connection.status && !connection.error ? null : !connected && <Alert severity="info">{he.moodleNotConnected}</Alert>}
      <TextField label={he.moodleBaseUrl} value={connection.baseUrl} onChange={(event) => connection.setBaseUrl(event.target.value)} dir="ltr" required />
      <TextField label={he.moodleToken} type="password" value={connection.token} onChange={(event) => connection.setToken(event.target.value)} dir="ltr" helperText={he.moodleTokenHint} required />
      <Button type="submit" variant="contained" disabled={connection.busy || !connection.baseUrl.trim() || !connection.token.trim()}>
        {he.moodleSaveConnection}
      </Button>
    </Box>
  );
}

import { useEffect, useState } from "react";
import {
  fetchMoodleConnection,
  moodleError,
  saveMoodleConnection,
  type MoodleConnectionStatus,
} from "../api/moodle";
import { he } from "../i18n/he";

export function useMoodleConnection() {
  const [status, setStatus] = useState<MoodleConnectionStatus | null>(null);
  const [baseUrl, setBaseUrl] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchMoodleConnection()
      .then((data) => {
        setStatus(data);
        setBaseUrl(data.base_url ?? "");
      })
      .catch((err) => setError(moodleError(err)));
  }, []);

  async function save() {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const data = await saveMoodleConnection(baseUrl.trim(), token.trim());
      setStatus(data);
      setBaseUrl(data.base_url ?? "");
      setToken("");
      setSuccess(he.moodleConnected);
    } catch (err) {
      setError(moodleError(err));
    } finally {
      setBusy(false);
    }
  }

  return { status, baseUrl, setBaseUrl, token, setToken, error, setError, success, setSuccess, busy, save };
}

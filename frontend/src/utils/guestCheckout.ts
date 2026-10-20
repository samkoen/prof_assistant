export type GuestEmailError = "required" | "invalid";

export function normalizeGuestEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function guestEmailError(email: string): GuestEmailError | null {
  const value = normalizeGuestEmail(email);
  if (!value) return "required";
  const parts = value.split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]?.includes(".")) return "invalid";
  return null;
}

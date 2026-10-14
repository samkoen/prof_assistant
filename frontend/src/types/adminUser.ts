import type { User } from "../api/client";

export type AdminUserCredits = {
  credits: number | null;
  unlimited: boolean;
  product: string | null;
};

export type AdminUser = User & { ai_credits: AdminUserCredits };

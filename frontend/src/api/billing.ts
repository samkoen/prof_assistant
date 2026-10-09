import { api } from "./client";
import type { AiCreditPack } from "../utils/aiCredits";

export interface WalletBalance {
  product: string;
  free_remaining: number;
  paid_remaining: number;
  total: number;
  unlimited: boolean;
}

export interface BillingBalance {
  wallets: WalletBalance[];
}

export interface CheckoutResult {
  order_id: number;
  transaction_id: string;
  payment_url: string;
}

export interface OrderStatus {
  transaction_id: string;
  status: string;
  credits: number;
  product: string;
}

let cached: BillingBalance | null = null;
let inflight: Promise<BillingBalance> | null = null;

export function invalidateBillingBalance(): void {
  cached = null;
}

export function notifyBillingChanged(): void {
  cached = null;
  window.dispatchEvent(new Event("ai-credits-changed"));
}

export function onBillingChanged(listener: () => void): () => void {
  window.addEventListener("ai-credits-changed", listener);
  return () => window.removeEventListener("ai-credits-changed", listener);
}

export async function fetchBillingBalance(): Promise<BillingBalance> {
  if (cached) return cached;
  if (!inflight) {
    inflight = api<BillingBalance>("/api/billing/balance")
      .then((data) => {
        cached = data;
        return data;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function walletFor(balance: BillingBalance, product: string): WalletBalance | undefined {
  return balance.wallets.find((row) => row.product === product);
}

export async function fetchBillingPacks(): Promise<AiCreditPack[]> {
  const data = await api<{ packs: AiCreditPack[] }>("/api/billing/packs");
  return data.packs;
}

export async function startCheckout(packCode: string): Promise<CheckoutResult> {
  return api<CheckoutResult>("/api/billing/checkout", {
    method: "POST",
    body: JSON.stringify({ pack_code: packCode }),
  });
}

export async function fetchOrderStatus(transactionId: string): Promise<OrderStatus> {
  return api<OrderStatus>(`/api/billing/orders/${transactionId}`);
}

export type { AiCreditPack };

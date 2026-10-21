import type { OrderStatus } from "@/db/schema";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "Alındı",
  preparing: "Hazırlanıyor",
  ready: "Hazır",
  served: "Teslim edildi",
  cancelled: "İptal edildi",
};

// Bir siparişin hangi durumdan hangisine geçebileceği
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["served"],
  served: [],
  cancelled: [],
};

export const canTransition = (from: OrderStatus, to: OrderStatus) => TRANSITIONS[from].includes(to);

export const nextStatus = (s: OrderStatus): OrderStatus | null =>
  TRANSITIONS[s].find((t) => t !== "cancelled") ?? null;

export const ACTIVE_STATUSES: OrderStatus[] = ["new", "preparing", "ready"];

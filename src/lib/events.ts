import { EventEmitter } from "node:events";
import type { OrderStatus, ServiceType } from "@/db/schema";

export type OrderEvent = {
  type: "created" | "status";
  orderId: string;
  status: OrderStatus;
};

export type ServiceEvent = {
  type: "service";
  requestId: number;
  tableName: string;
  service: ServiceType;
  resolved: boolean;
};

export type LiveEvent = OrderEvent | ServiceEvent;

// Sunucu içi yayın kanalı. Mutfak paneli ve müşteri ekranı SSE ile bunu dinler.
// Not: Tek sunucu örneği için uygundur; çok sunuculu kurulumda Redis veya
// Postgres LISTEN/NOTIFY ile değiştirilmelidir.
const globalForBus = globalThis as unknown as { orderBus?: EventEmitter };
export const orderBus = globalForBus.orderBus ?? new EventEmitter().setMaxListeners(0);
globalForBus.orderBus = orderBus;

export const publishOrderEvent = (e: OrderEvent) => orderBus.emit("order", e);
export const publishServiceEvent = (e: ServiceEvent) => orderBus.emit("service", e);

"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { useOrderEvents } from "@/lib/use-order-events";

/** Sunucuda çizilen sayfayı yeni sipariş veya çağrı geldikçe tazeler. */
export function LiveRefresh() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useOrderEvents(
    "/api/events",
    (e) => {
      if (!e) return;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 400);
    },
    60000,
  );
  return null;
}

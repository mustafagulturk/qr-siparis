"use client";

import { useEffect, useRef } from "react";
import type { OrderEvent } from "./events";

/**
 * Sunucudan gelen sipariş olaylarını dinler. Bağlantı koparsa tarayıcı
 * otomatik yeniden bağlanır; ek güvence için belirli aralıklarla da yeniler.
 */
export function useOrderEvents(url: string, onEvent: (e: OrderEvent | null) => void, fallbackMs = 15000) {
  const handler = useRef(onEvent);
  handler.current = onEvent;

  useEffect(() => {
    const source = new EventSource(url);
    source.onmessage = (m) => handler.current(JSON.parse(m.data));
    // Yeniden bağlanınca arada kaçan olaylar olabilir, veriyi tazele
    source.onopen = () => handler.current(null);
    const timer = setInterval(() => handler.current(null), fallbackMs);
    return () => {
      source.close();
      clearInterval(timer);
    };
  }, [url, fallbackMs]);
}

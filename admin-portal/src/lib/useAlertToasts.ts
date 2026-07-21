"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/Toast";
import type { PublicAlert } from "@/lib/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

/**
 * Listens to the WebSocket relay's "new-alerts" broadcasts and shows a toast
 * for each one — mounted at the dashboard layout level so it fires no matter
 * which admin page is open, not just Live Tracking or Alerts.
 */
export function useAlertToasts() {
  const { showToast } = useToast();
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!WS_URL || hasMountedRef.current) return;
    hasMountedRef.current = true;

    let socket: WebSocket | null = null;
    let cancelled = false;

    try {
      socket = new WebSocket(WS_URL);

      socket.onmessage = (event) => {
        if (cancelled) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "new-alerts") {
            const alerts: PublicAlert[] = msg.data;
            for (const alert of alerts) {
              showToast(
                alert.bus ? `${alert.type} — ${alert.bus.busNumber}` : alert.type,
                alert.message,
                alert.type === "ROUTE_DEVIATION" ? "warning" : "danger"
              );
            }
          }
        } catch {
          // ignore malformed frames
        }
      };
    } catch {
      // WebSocket unavailable — toasts just won't fire, no fallback needed
    }

    return () => {
      cancelled = true;
      socket?.close();
      hasMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

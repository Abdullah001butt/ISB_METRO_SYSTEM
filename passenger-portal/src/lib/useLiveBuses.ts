"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { LiveBus } from "@/lib/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL;
const FALLBACK_POLL_MS = 8000;

/**
 * Live bus feed via WebSocket when available (instant push from the ws-server
 * relay), falling back to REST polling if the socket is unreachable or closes.
 */
export function useLiveBuses() {
  const [buses, setBuses] = useState<LiveBus[]>([]);
  const [source, setSource] = useState<"websocket" | "polling">("polling");
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    let socket: WebSocket | null = null;

    function startPolling() {
      if (pollIntervalRef.current) return;
      setSource("polling");

      async function poll() {
        try {
          const res = await api.get<{ buses: LiveBus[] }>("/api/live-buses");
          if (!cancelled) setBuses(res.buses);
        } catch {
          // ignore — page shows whatever it last had
        }
      }

      poll();
      pollIntervalRef.current = setInterval(poll, FALLBACK_POLL_MS);
    }

    function stopPolling() {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    if (!WS_URL) {
      startPolling();
      return () => {
        cancelled = true;
        stopPolling();
      };
    }

    try {
      socket = new WebSocket(WS_URL);

      socket.onopen = () => {
        if (cancelled) return;
        stopPolling();
        setSource("websocket");
      };

      socket.onmessage = (event) => {
        if (cancelled) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "live-buses") setBuses(msg.data);
        } catch {
          // ignore malformed frames
        }
      };

      socket.onerror = () => {
        if (!cancelled) startPolling();
      };

      socket.onclose = () => {
        if (!cancelled) startPolling();
      };
    } catch {
      startPolling();
    }

    return () => {
      cancelled = true;
      stopPolling();
      socket?.close();
    };
  }, []);

  return { buses, source };
}

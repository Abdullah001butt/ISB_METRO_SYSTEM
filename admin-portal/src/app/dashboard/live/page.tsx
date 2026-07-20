"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import type { LiveBus } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";

const LiveMap = dynamic(() => import("@/components/LiveMap").then((m) => m.LiveMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted">
      Loading map...
    </div>
  ),
});

export default function LiveTrackingPage() {
  const [buses, setBuses] = useState<LiveBus[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await api.get<{ buses: LiveBus[] }>("/api/live-buses");
        if (!cancelled) {
          setBuses(res.buses);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load buses");
      }
    }

     
    load();
    const interval = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const reporting = buses.filter((b) => b.location).length;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeader
        title="Live Tracking"
        description="Refreshes every 5s."
        action={
          <Badge tone={reporting > 0 ? "green" : "gray"}>
            {reporting} of {buses.length} buses reporting
          </Badge>
        }
      />

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-line shadow-sm">
        <LiveMap buses={buses} />
      </div>
    </div>
  );
}

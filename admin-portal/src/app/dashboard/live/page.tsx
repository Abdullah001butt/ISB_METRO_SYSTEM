"use client";

import dynamic from "next/dynamic";
import { useLiveBuses } from "@/lib/useLiveBuses";
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
  const { buses, source, error } = useLiveBuses();
  const reporting = buses.filter((b) => b.location).length;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeader
        title="Live Tracking"
        description={source === "websocket" ? "Live via WebSocket — instant updates." : "Refreshes every 8s (polling)."}
        action={
          <div className="flex items-center gap-2">
            <Badge tone={source === "websocket" ? "green" : "gray"}>
              {source === "websocket" ? "Real-time" : "Polling"}
            </Badge>
            <Badge tone={reporting > 0 ? "green" : "gray"}>
              {reporting} of {buses.length} buses reporting
            </Badge>
          </div>
        }
      />

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-line shadow-sm">
        <LiveMap buses={buses} />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useLiveBuses } from "@/lib/useLiveBuses";
import { api } from "@/lib/api";
import type { Bus, GpsLogEntry, LiveBus } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";

const LiveMap = dynamic(() => import("@/components/LiveMap").then((m) => m.LiveMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted">
      Loading map...
    </div>
  ),
});

function LiveView() {
  const { buses, source, error } = useLiveBuses();
  const reporting = buses.filter((b) => b.location).length;

  return (
    <>
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
    </>
  );
}

const PLAYBACK_INTERVAL_MS = 400;

function ReplayView() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [busId, setBusId] = useState("");
  const [history, setHistory] = useState<GpsLogEntry[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.get<{ buses: Bus[] }>("/api/buses").then((res) => setBuses(res.buses));
  }, []);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setIndex((i) => {
        if (i >= history.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, PLAYBACK_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, history.length]);

  async function loadHistory() {
    if (!busId) return;
    setLoading(true);
    setPlaying(false);
    try {
      const res = await api.get<{ logs: GpsLogEntry[] }>(`/api/gps/history?busId=${busId}&limit=200`);
      // backend returns newest-first — reverse for chronological playback
      const chronological = res.logs.slice().reverse();
      setHistory(chronological);
      setIndex(0);
    } finally {
      setLoading(false);
    }
  }

  const currentPoint = history[index];
  const selectedBus = buses.find((b) => b.id === busId);

  const replayBuses = useMemo<LiveBus[]>(() => {
    if (!currentPoint || !selectedBus) return [];
    return [
      {
        ...selectedBus,
        location: {
          latitude: currentPoint.latitude,
          longitude: currentPoint.longitude,
          speed: currentPoint.speed,
          recordedAt: currentPoint.recordedAt,
        },
        crowdLevel: null,
      },
    ];
  }, [currentPoint, selectedBus]);

  return (
    <>
      <PageHeader
        title="Route Replay"
        description="Play back a bus's recorded GPS history."
        action={
          <div className="flex items-center gap-2">
            <Select value={busId} onChange={(e) => setBusId(e.target.value)}>
              <option value="">Select a bus...</option>
              {buses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.busNumber}
                </option>
              ))}
            </Select>
            <Button onClick={loadHistory} disabled={!busId || loading}>
              <Icon name="history" size={16} />
              {loading ? "Loading..." : "Load"}
            </Button>
          </div>
        }
      />

      {history.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-line bg-surface text-sm text-muted">
          Select a bus and load its history to replay it.
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-3">
            <Button variant="secondary" onClick={() => setPlaying((p) => !p)}>
              <Icon name={playing ? "pause" : "play_arrow"} size={16} />
              {playing ? "Pause" : "Play"}
            </Button>
            <input
              type="range"
              min={0}
              max={history.length - 1}
              value={index}
              onChange={(e) => {
                setPlaying(false);
                setIndex(Number(e.target.value));
              }}
              className="flex-1"
            />
            <span className="w-40 shrink-0 text-right text-xs text-muted tabular-nums">
              {currentPoint ? new Date(currentPoint.recordedAt).toLocaleString() : ""}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-line shadow-sm">
            <LiveMap buses={replayBuses} />
          </div>
        </>
      )}
    </>
  );
}

export default function LiveTrackingPage() {
  const [mode, setMode] = useState<"live" | "replay">("live");

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 flex gap-1 rounded-xl border border-line bg-surface p-1">
        {(["live", "replay"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              mode === m ? "bg-accent-soft text-accent-strong" : "text-muted hover:bg-canvas"
            }`}
          >
            {m === "live" ? "Live" : "Route Replay"}
          </button>
        ))}
      </div>

      {mode === "live" ? <LiveView /> : <ReplayView />}
    </div>
  );
}

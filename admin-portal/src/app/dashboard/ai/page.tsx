"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AIPrediction, Bus, Station } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { TableShell, Thead, EmptyRow } from "@/components/ui/DataTable";

export default function AIPredictionsPage() {
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [busById, setBusById] = useState<Map<string, Bus>>(new Map());
  const [stationById, setStationById] = useState<Map<string, Station>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [predictionsRes, busesRes, stationsRes] = await Promise.all([
          api.get<{ predictions: AIPrediction[] }>("/api/predictions"),
          api.get<{ buses: Bus[] }>("/api/buses"),
          api.get<{ stations: Station[] }>("/api/stations"),
        ]);
        if (cancelled) return;
        setPredictions(predictionsRes.predictions);
        setBusById(new Map(busesRes.buses.map((b) => [b.id, b])));
        setStationById(new Map(stationsRes.stations.map((s) => [s.id, s])));
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load predictions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

     
    load();
    const interval = setInterval(load, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="AI Predictions"
        description="Most recent ETA/delay predictions pushed by the AI module. Refreshes every 8s."
      />

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      <TableShell>
        <Thead columns={["Bus", "Route", "Station", "ETA (min)", "Delay (min)", "Predicted At"]} />
        <tbody className="divide-y divide-line">
          {loading ? (
            <EmptyRow colSpan={6}>Loading...</EmptyRow>
          ) : predictions.length === 0 ? (
            <EmptyRow colSpan={6}>
              No predictions yet — the AI module hasn&apos;t published anything.
            </EmptyRow>
          ) : (
            predictions.map((p) => {
              const bus = busById.get(p.busId);
              const station = p.stationId ? stationById.get(p.stationId) : undefined;
              const delay = p.predictedDelayMinutes;

              return (
                <tr key={p.id} className="hover:bg-canvas">
                  <td className="px-4 py-3 font-medium text-ink">{bus?.busNumber ?? p.busId}</td>
                  <td className="px-4 py-3 text-muted">{bus?.route?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-muted">{station?.name ?? p.stationId ?? "-"}</td>
                  <td className="px-4 py-3 text-ink tabular-nums">{p.predictedEtaMinutes ?? "-"}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {delay != null ? (
                      <Badge tone={delay >= 5 ? "red" : delay >= 2 ? "yellow" : "green"}>
                        {delay.toFixed(1)} min
                      </Badge>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {new Date(p.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </TableShell>
    </div>
  );
}

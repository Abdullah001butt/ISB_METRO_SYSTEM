"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { haversineDistanceKm } from "@/lib/geo";
import type { Route } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

const AVG_SPEED_KMH = 22;

function computeTripResult(originId: string, destinationId: string, routes: Route[]) {
  if (!originId || !destinationId || originId === destinationId) return null;

  for (const route of routes) {
    const sorted = route.busRoutes.slice().sort((a, b) => a.sequence - b.sequence);
    const originIdx = sorted.findIndex((br) => br.station.id === originId);
    const destIdx = sorted.findIndex((br) => br.station.id === destinationId);
    if (originIdx === -1 || destIdx === -1 || originIdx === destIdx) continue;

    const [from, to] = originIdx < destIdx ? [originIdx, destIdx] : [destIdx, originIdx];
    const segment = sorted.slice(from, to + 1);

    let distanceKm = 0;
    for (let i = 0; i < segment.length - 1; i++) {
      const a = segment[i].station;
      const b = segment[i + 1].station;
      distanceKm += haversineDistanceKm(a.latitude, a.longitude, b.latitude, b.longitude);
    }

    return {
      route,
      stations: originIdx < destIdx ? segment : segment.slice().reverse(),
      distanceKm,
      etaMinutes: (distanceKm / AVG_SPEED_KMH) * 60,
    };
  }

  return "no-route" as const;
}

export default function PlannerPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");

  useEffect(() => {
    api
      .get<{ routes: Route[] }>("/api/routes")
      .then((res) => setRoutes(res.routes))
      .finally(() => setLoading(false));
  }, []);

  const allStations = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    routes.forEach((r) => r.busRoutes.forEach((br) => map.set(br.station.id, br.station)));
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [routes]);

  const result = computeTripResult(originId, destinationId, routes);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold text-ink">Trip Planner</h1>
      <p className="mt-1 text-sm text-muted">
        Pick your origin and destination to estimate travel time along the route.
      </p>

      <Card className="mt-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-muted">From</label>
            <select
              value={originId}
              onChange={(e) => setOriginId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Select a station...</option>
              {allStations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted">To</label>
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Select a station...</option>
              {allStations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <div className="mt-6">
        {loading ? (
          <p className="text-center text-sm text-muted">Loading routes...</p>
        ) : result === "no-route" ? (
          <Card>
            <p className="text-center text-sm text-muted">
              No single route directly connects these two stations yet.
            </p>
          </Card>
        ) : result ? (
          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Icon name="alt_route" size={16} className="text-accent" />
              {result.route.name}
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg bg-accent-soft px-4 py-3 text-accent-strong">
              <Icon name="schedule" size={18} />
              <span className="text-lg font-bold">{Math.round(result.etaMinutes)} min</span>
              <span className="text-sm">
                (~{result.distanceKm.toFixed(1)} km)
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-muted">
              {result.stations.map((br, i, arr) => (
                <span key={br.id} className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1 rounded-md bg-canvas px-2 py-1 font-medium text-ink">
                    <Icon name="location_on" size={11} />
                    {br.station.name}
                  </span>
                  {i < arr.length - 1 && <Icon name="arrow_forward" size={12} className="text-muted" />}
                </span>
              ))}
            </div>
          </Card>
        ) : (
          <p className="text-center text-sm text-muted">
            Select an origin and destination to see the estimate.
          </p>
        )}
      </div>
    </div>
  );
}

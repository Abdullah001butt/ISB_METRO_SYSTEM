"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { RouteAnalytics } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BarChart } from "@/components/ui/BarChart";
import { Icon } from "@/components/ui/Icon";

function onTimeTone(pct: number | null) {
  if (pct == null) return "gray" as const;
  if (pct >= 70) return "green" as const;
  if (pct >= 40) return "yellow" as const;
  return "red" as const;
}

export default function AnalyticsPage() {
  const [routes, setRoutes] = useState<RouteAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ routes: RouteAnalytics[] }>("/api/analytics/routes")
      .then((res) => setRoutes(res.routes))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Route performance computed from real accumulated GPS and prediction history."
      />

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : routes.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-muted">No routes yet.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {routes.map((r) => (
            <Card key={r.routeId}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-ink">{r.routeName}</p>
                  <p className="text-xs text-muted">{r.sampleCount} predictions analyzed</p>
                </div>
                <Badge tone={onTimeTone(r.onTimePercentage)}>
                  {r.onTimePercentage != null ? `${r.onTimePercentage}% on-time` : "No data"}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-canvas p-3">
                  <p className="flex items-center gap-1.5 text-xs text-muted">
                    <Icon name="hourglass_top" size={13} />
                    Avg delay
                  </p>
                  <p className="mt-1 text-lg font-semibold text-ink tabular-nums">
                    {r.avgDelayMinutes != null ? `${r.avgDelayMinutes} min` : "-"}
                  </p>
                </div>
                <div className="rounded-lg bg-canvas p-3">
                  <p className="flex items-center gap-1.5 text-xs text-muted">
                    <Icon name="speed" size={13} />
                    Avg speed (peak sample)
                  </p>
                  <p className="mt-1 text-lg font-semibold text-ink tabular-nums">
                    {r.speedByHour.length > 0
                      ? `${Math.max(...r.speedByHour.map((h) => h.avgSpeedKmh)).toFixed(0)} km/h`
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-muted">Average speed by hour of day</p>
                <BarChart
                  data={r.speedByHour.map((h) => ({ label: `${h.hour}h`, value: h.avgSpeedKmh }))}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

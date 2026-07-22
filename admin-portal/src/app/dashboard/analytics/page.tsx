"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { RouteAnalytics, DriverPerformance, AlertAnalytics } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BarChart } from "@/components/ui/BarChart";
import { Icon } from "@/components/ui/Icon";
import { TableShell, Thead, EmptyRow } from "@/components/ui/DataTable";
import { exportCsv, exportPdf } from "@/lib/export";

type Tab = "routes" | "drivers" | "alerts";

function onTimeTone(pct: number | null) {
  if (pct == null) return "gray" as const;
  if (pct >= 70) return "green" as const;
  if (pct >= 40) return "yellow" as const;
  return "red" as const;
}

function ExportButtons({
  onCsv,
  onPdf,
}: {
  onCsv: () => void;
  onPdf: () => void;
}) {
  return (
    <div className="flex gap-2">
      <Button variant="secondary" onClick={onCsv}>
        <Icon name="download" size={15} />
        CSV
      </Button>
      <Button variant="secondary" onClick={onPdf}>
        <Icon name="picture_as_pdf" size={15} />
        PDF
      </Button>
    </div>
  );
}

function RoutesTab({ routes }: { routes: RouteAnalytics[] }) {
  if (routes.length === 0) {
    return (
      <Card>
        <p className="text-center text-sm text-muted">No routes yet.</p>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <ExportButtons
          onCsv={() =>
            exportCsv(
              "route-analytics.csv",
              ["Route", "On-time %", "Avg Delay (min)", "Samples"],
              routes.map((r) => [
                r.routeName,
                r.onTimePercentage ?? "-",
                r.avgDelayMinutes ?? "-",
                r.sampleCount,
              ])
            )
          }
          onPdf={() =>
            exportPdf(
              "Route Performance Analytics",
              "route-analytics.pdf",
              ["Route", "On-time %", "Avg Delay (min)", "Samples"],
              routes.map((r) => [
                r.routeName,
                r.onTimePercentage ?? "-",
                r.avgDelayMinutes ?? "-",
                r.sampleCount,
              ])
            )
          }
        />
      </div>
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
              <BarChart data={r.speedByHour.map((h) => ({ label: `${h.hour}h`, value: h.avgSpeedKmh }))} />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function DriversTab({ drivers }: { drivers: DriverPerformance[] }) {
  return (
    <>
      <div className="mb-4 flex justify-end">
        <ExportButtons
          onCsv={() =>
            exportCsv(
              "driver-performance.csv",
              ["Driver", "Status", "Trips Completed", "Total Hours", "Alerts"],
              drivers.map((d) => [
                d.driverName,
                d.isActive ? "Active" : "Inactive",
                d.tripsCompleted,
                (d.totalDurationMinutes / 60).toFixed(1),
                d.alertCount,
              ])
            )
          }
          onPdf={() =>
            exportPdf(
              "Driver Performance",
              "driver-performance.pdf",
              ["Driver", "Status", "Trips", "Total Hours", "Alerts"],
              drivers.map((d) => [
                d.driverName,
                d.isActive ? "Active" : "Inactive",
                d.tripsCompleted,
                (d.totalDurationMinutes / 60).toFixed(1),
                d.alertCount,
              ])
            )
          }
        />
      </div>
      <TableShell>
        <Thead columns={["Driver", "Status", "Trips", "Total Hours", "Alerts on Assigned Buses"]} />
        <tbody className="divide-y divide-line">
          {drivers.length === 0 ? (
            <EmptyRow colSpan={5}>No drivers yet.</EmptyRow>
          ) : (
            drivers
              .slice()
              .sort((a, b) => b.tripsCompleted - a.tripsCompleted)
              .map((d) => (
                <tr key={d.driverId} className="hover:bg-canvas">
                  <td className="px-4 py-3 font-medium text-ink">{d.driverName}</td>
                  <td className="px-4 py-3">
                    <Badge tone={d.isActive ? "green" : "gray"}>{d.isActive ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted tabular-nums">{d.tripsCompleted}</td>
                  <td className="px-4 py-3 text-muted tabular-nums">
                    {(d.totalDurationMinutes / 60).toFixed(1)}h
                  </td>
                  <td className="px-4 py-3 text-muted tabular-nums">{d.alertCount}</td>
                </tr>
              ))
          )}
        </tbody>
      </TableShell>
    </>
  );
}

function AlertsTab({ data }: { data: AlertAnalytics | null }) {
  if (!data) return null;

  const totalsByType = new Map<string, number>();
  for (const row of data.daily) {
    totalsByType.set(row.type, (totalsByType.get(row.type) ?? 0) + row.count);
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">
          Last {data.lookbackDays} days · {data.currentlyOpen} currently open
        </p>
        <ExportButtons
          onCsv={() =>
            exportCsv(
              "alert-analytics-by-route.csv",
              ["Route", "Type", "Count"],
              data.byRoute.map((r) => [r.routeName, r.type, r.count])
            )
          }
          onPdf={() =>
            exportPdf(
              "Alert Analytics by Route",
              "alert-analytics.pdf",
              ["Route", "Type", "Count"],
              data.byRoute.map((r) => [r.routeName, r.type, r.count])
            )
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[...totalsByType.entries()].map(([type, count]) => (
          <Card key={type}>
            <p className="text-xs text-muted">{type.replace("_", " ")}</p>
            <p className="mt-1 text-2xl font-bold text-ink tabular-nums">{count}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium text-ink">By Route</p>
        <TableShell>
          <Thead columns={["Route", "Type", "Count"]} />
          <tbody className="divide-y divide-line">
            {data.byRoute.length === 0 ? (
              <EmptyRow colSpan={3}>No alerts in this period.</EmptyRow>
            ) : (
              data.byRoute.map((row, i) => (
                <tr key={i} className="hover:bg-canvas">
                  <td className="px-4 py-3 font-medium text-ink">{row.routeName}</td>
                  <td className="px-4 py-3 text-muted">{row.type}</td>
                  <td className="px-4 py-3 text-muted tabular-nums">{row.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </TableShell>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium text-ink">Average Time to Resolve</p>
        <TableShell>
          <Thead columns={["Type", "Avg Resolution", "Resolved Count"]} />
          <tbody className="divide-y divide-line">
            {data.resolution.length === 0 ? (
              <EmptyRow colSpan={3}>No resolved alerts in this period.</EmptyRow>
            ) : (
              data.resolution.map((row) => (
                <tr key={row.type} className="hover:bg-canvas">
                  <td className="px-4 py-3 font-medium text-ink">{row.type}</td>
                  <td className="px-4 py-3 text-muted tabular-nums">
                    {row.avgResolutionMinutes != null ? `${row.avgResolutionMinutes} min` : "-"}
                  </td>
                  <td className="px-4 py-3 text-muted tabular-nums">{row.resolvedCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </TableShell>
      </div>
    </>
  );
}

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>("routes");
  const [routes, setRoutes] = useState<RouteAnalytics[]>([]);
  const [drivers, setDrivers] = useState<DriverPerformance[]>([]);
  const [alerts, setAlerts] = useState<AlertAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<{ routes: RouteAnalytics[] }>("/api/analytics/routes"),
      api.get<{ drivers: DriverPerformance[] }>("/api/analytics/drivers"),
      api.get<AlertAnalytics>("/api/analytics/alerts"),
    ])
      .then(([routesRes, driversRes, alertsRes]) => {
        setRoutes(routesRes.routes);
        setDrivers(driversRes.drivers);
        setAlerts(alertsRes);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: "routes", label: "Routes" },
    { id: "drivers", label: "Drivers" },
    { id: "alerts", label: "Alerts" },
  ];

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Route performance, driver activity, and alert trends computed from real accumulated data."
      />

      <div className="mb-6 flex gap-1 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? "border-accent text-accent-strong" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : tab === "routes" ? (
        <RoutesTab routes={routes} />
      ) : tab === "drivers" ? (
        <DriversTab drivers={drivers} />
      ) : (
        <AlertsTab data={alerts} />
      )}
    </div>
  );
}

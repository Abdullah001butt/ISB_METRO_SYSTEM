"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useLiveBuses } from "@/lib/useLiveBuses";
import type { Driver, Alert } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { Sparkline } from "@/components/ui/Sparkline";

const HISTORY_LENGTH = 12;

const statConfig = [
  { key: "total", label: "Total Buses", icon: "directions_bus", tone: "text-ink bg-canvas" },
  { key: "online", label: "Online", icon: "sensors", tone: "text-accent-strong bg-accent-soft" },
  { key: "offline", label: "Offline", icon: "wifi_off", tone: "text-muted bg-canvas" },
  { key: "drivers", label: "Active Drivers", icon: "badge", tone: "text-accent-strong bg-accent-soft" },
  { key: "alerts", label: "Open Alerts", icon: "notifications", tone: "text-danger bg-danger-soft" },
] as const;

type StatKey = (typeof statConfig)[number]["key"];
type History = Record<StatKey, number[]>;

const emptyHistory: History = { total: [], online: [], offline: [], drivers: [], alerts: [] };

function StatCard({
  label,
  value,
  icon,
  tone,
  history,
  sparkColor,
}: {
  label: string;
  value: number;
  icon: string;
  tone: string;
  history: number[];
  sparkColor: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
          <Icon name={icon} size={20} />
        </span>
      </div>
      <p className="mt-3 text-xs font-medium text-muted">{label}</p>
      <p className="mt-0.5 text-2xl font-semibold text-ink tabular-nums">{value}</p>
      <Sparkline values={history} color={sparkColor} />
    </Card>
  );
}

export default function DashboardPage() {
  const { buses, source } = useLiveBuses();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<History>(emptyHistory);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [driversRes, alertsRes] = await Promise.all([
          api.get<{ drivers: Driver[] }>("/api/drivers"),
          api.get<{ alerts: Alert[] }>("/api/alerts?status=OPEN"),
        ]);
        if (cancelled) return;
        setDrivers(driversRes.drivers);
        setAlerts(alertsRes.alerts);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load dashboard");
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

  useEffect(() => {
    const online = buses.filter((b) => b.location).length;
    const values: Record<StatKey, number> = {
      total: buses.length,
      online,
      offline: buses.length - online,
      drivers: drivers.filter((d) => d.isActive).length,
      alerts: alerts.length,
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect -- appending a rolling sparkline history when live data changes
    setHistory((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(values) as StatKey[]) {
        next[key] = [...prev[key], values[key]].slice(-HISTORY_LENGTH);
      }
      return next;
    });
     
  }, [buses, drivers, alerts]);

  const onlineBuses = buses.filter((b) => b.location).length;
  const values: Record<StatKey, number> = {
    total: buses.length,
    online: onlineBuses,
    offline: buses.length - onlineBuses,
    drivers: drivers.filter((d) => d.isActive).length,
    alerts: alerts.length,
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={
          source === "websocket"
            ? "Live overview — bus data via WebSocket, rest refreshes every 8s."
            : "Live overview of the network. Refreshes every 8s."
        }
      />

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {statConfig.map((s) => (
              <StatCard
                key={s.key}
                label={s.label}
                value={values[s.key]}
                icon={s.icon}
                tone={s.tone}
                history={history[s.key]}
                sparkColor={s.key === "alerts" ? "#c0392b" : "#059669"}
              />
            ))}
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-semibold text-ink">Open Alerts</h2>
            <Card className="mt-3" padded={false}>
              {alerts.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted">No open alerts.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {alerts.map((a) => (
                    <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <Badge tone={a.type === "DELAY" ? "yellow" : "red"}>{a.type}</Badge>
                        <span className="text-ink/80">{a.message}</span>
                      </div>
                      <span className="text-xs text-muted">{a.bus?.busNumber}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Alert } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { TableShell, Thead, EmptyRow } from "@/components/ui/DataTable";
import { Icon } from "@/components/ui/Icon";

const statusOptions = ["OPEN", "ACKNOWLEDGED", "RESOLVED"] as const;

function statusTone(status: string) {
  if (status === "OPEN") return "red" as const;
  if (status === "ACKNOWLEDGED") return "yellow" as const;
  return "green" as const;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const query = filter ? `?status=${filter}` : "";
      const res = await api.get<{ alerts: Alert[] }>(`/api/alerts${query}`);
      setAlerts(res.alerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function updateStatus(id: string, status: (typeof statusOptions)[number]) {
    try {
      await api.patch(`/api/alerts/${id}`, { status });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update alert");
    }
  }

  return (
    <div>
      <PageHeader
        title="Alerts"
        description="Automatic route deviation and delay detection."
        action={
          <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        }
      />

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      <TableShell>
        <Thead columns={["Bus", "Type", "Message", "Photo", "Status", "Created", ""]} />
        <tbody className="divide-y divide-line">
          {loading ? (
            <EmptyRow colSpan={7}>Loading...</EmptyRow>
          ) : alerts.length === 0 ? (
            <EmptyRow colSpan={7}>No alerts.</EmptyRow>
          ) : (
            alerts.map((a) => (
              <tr key={a.id} className="hover:bg-canvas">
                <td className="px-4 py-3 font-medium text-ink">{a.bus?.busNumber ?? "-"}</td>
                <td className="px-4 py-3 text-muted">{a.type}</td>
                <td className="px-4 py-3 text-muted">{a.message}</td>
                <td className="px-4 py-3">
                  {a.photoDataUrl ? (
                    <a href={a.photoDataUrl} target="_blank" rel="noreferrer">
                      <img
                        src={a.photoDataUrl}
                        alt="Incident photo"
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    </a>
                  ) : (
                    <Icon name="image_not_supported" size={16} className="text-muted" />
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone(a.status)}>{a.status}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {new Date(a.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Select
                    value={a.status}
                    onChange={(e) => updateStatus(a.id, e.target.value as (typeof statusOptions)[number])}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableShell>
    </div>
  );
}

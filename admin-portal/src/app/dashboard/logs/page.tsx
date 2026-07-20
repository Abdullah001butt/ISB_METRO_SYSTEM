"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ActivityLog } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableShell, Thead, EmptyRow } from "@/components/ui/DataTable";

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ logs: ActivityLog[] }>("/api/logs")
      .then((res) => setLogs(res.logs))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load logs"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Activity Logs" description="Most recent 100 admin actions." />

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      <TableShell>
        <Thead columns={["Admin", "Action", "Details", "When"]} />
        <tbody className="divide-y divide-line">
          {loading ? (
            <EmptyRow colSpan={4}>Loading...</EmptyRow>
          ) : logs.length === 0 ? (
            <EmptyRow colSpan={4}>No activity yet.</EmptyRow>
          ) : (
            logs.map((l) => (
              <tr key={l.id} className="hover:bg-canvas">
                <td className="px-4 py-3 text-ink/80">{l.admin?.email ?? "-"}</td>
                <td className="px-4 py-3 font-medium text-ink">{l.action}</td>
                <td className="px-4 py-3 text-muted">{l.details}</td>
                <td className="px-4 py-3 text-xs text-muted">
                  {new Date(l.createdAt).toLocaleString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableShell>
    </div>
  );
}

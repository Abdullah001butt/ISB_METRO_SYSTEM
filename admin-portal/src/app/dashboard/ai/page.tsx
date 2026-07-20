"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AIPrediction } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableShell, Thead, EmptyRow } from "@/components/ui/DataTable";

export default function AIPredictionsPage() {
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ predictions: AIPrediction[] }>("/api/predictions")
      .then((res) => setPredictions(res.predictions))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load predictions"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="AI Predictions"
        description="Most recent ETA/delay predictions pushed by the AI module."
      />

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      <TableShell>
        <Thead columns={["Bus ID", "Station ID", "ETA (min)", "Delay (min)", "Predicted At"]} />
        <tbody className="divide-y divide-line">
          {loading ? (
            <EmptyRow colSpan={5}>Loading...</EmptyRow>
          ) : predictions.length === 0 ? (
            <EmptyRow colSpan={5}>
              No predictions yet — the AI module hasn&apos;t published anything.
            </EmptyRow>
          ) : (
            predictions.map((p) => (
              <tr key={p.id} className="hover:bg-canvas">
                <td className="px-4 py-3 font-mono text-xs text-ink/80">{p.busId}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted">{p.stationId ?? "-"}</td>
                <td className="px-4 py-3 text-ink">{p.predictedEtaMinutes ?? "-"}</td>
                <td className="px-4 py-3 text-ink">{p.predictedDelayMinutes ?? "-"}</td>
                <td className="px-4 py-3 text-xs text-muted">
                  {new Date(p.createdAt).toLocaleString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableShell>
    </div>
  );
}

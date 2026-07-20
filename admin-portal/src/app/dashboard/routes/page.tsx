"use client";

import { useEffect, useState, FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import type { Route, Station } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedStationIds, setSelectedStationIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [routesRes, stationsRes] = await Promise.all([
        api.get<{ routes: Route[] }>("/api/routes"),
        api.get<{ stations: Station[] }>("/api/stations"),
      ]);
      setRoutes(routesRes.routes);
      setStations(stationsRes.stations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load routes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  function toggleStation(id: string) {
    setSelectedStationIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/api/routes", {
        name,
        description: description || undefined,
        stationIds: selectedStationIds,
      });
      setName("");
      setDescription("");
      setSelectedStationIds([]);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create route");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this route?")) return;
    try {
      await api.delete(`/api/routes/${id}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete route");
    }
  }

  return (
    <div>
      <PageHeader title="Routes" description="Ordered station sequences buses follow." />

      <Card>
        <form onSubmit={handleCreate}>
          <div className="flex flex-wrap gap-3">
            <Field label="Name">
              <Input required value={name} onChange={(e) => setName(e.target.value)} className="w-48" />
            </Field>
            <Field label="Description">
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-64"
              />
            </Field>
          </div>

          <div className="mt-4">
            <p className="text-xs font-medium text-muted">Stations (click to add, in order)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {stations.length === 0 && (
                <p className="text-xs text-muted">Add stations first on the Stations page.</p>
              )}
              {stations.map((s) => {
                const idx = selectedStationIds.indexOf(s.id);
                const selected = idx !== -1;
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggleStation(s.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selected
                        ? "bg-accent text-white"
                        : "bg-canvas text-muted hover:bg-line"
                    }`}
                  >
                    {selected ? `${idx + 1}. ` : ""}
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="mt-5">
            <Icon name="add" size={16} />
            Add Route
          </Button>
        </form>
      </Card>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : routes.length === 0 ? (
          <Card>
            <p className="text-center text-sm text-muted">No routes yet — add one above.</p>
          </Card>
        ) : (
          routes.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{r.name}</p>
                  {r.description && <p className="text-sm text-muted">{r.description}</p>}
                </div>
                <Button variant="danger" onClick={() => handleDelete(r.id)}>
                  <Icon name="delete" size={14} />
                  Delete
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                {r.busRoutes.length === 0 ? (
                  <span>No stations assigned</span>
                ) : (
                  r.busRoutes
                    .slice()
                    .sort((a, b) => a.sequence - b.sequence)
                    .map((br, i, arr) => (
                      <span key={br.id} className="flex items-center gap-1.5">
                        <span className="rounded-md bg-canvas px-2 py-0.5 font-medium text-ink">
                          {br.station.name}
                        </span>
                        {i < arr.length - 1 && <Icon name="arrow_forward" size={12} className="text-muted" />}
                      </span>
                    ))
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

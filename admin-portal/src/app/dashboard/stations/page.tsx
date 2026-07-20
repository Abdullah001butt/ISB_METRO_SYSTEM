"use client";

import { useEffect, useState, FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import type { Station } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { TableShell, Thead, EmptyRow } from "@/components/ui/DataTable";

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ stations: Station[] }>("/api/stations");
      setStations(res.stations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/api/stations", {
        name,
        latitude: Number(latitude),
        longitude: Number(longitude),
      });
      setName("");
      setLatitude("");
      setLongitude("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create station");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this station?")) return;
    try {
      await api.delete(`/api/stations/${id}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete station");
    }
  }

  return (
    <div>
      <PageHeader title="Stations" description="Metro bus stops across the network." />

      <Card>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
          <Field label="Name">
            <Input required value={name} onChange={(e) => setName(e.target.value)} className="w-40" />
          </Field>
          <Field label="Latitude">
            <Input
              required
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="w-32"
            />
          </Field>
          <Field label="Longitude">
            <Input
              required
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="w-32"
            />
          </Field>
          <Button type="submit" disabled={submitting}>
            <Icon name="add" size={16} />
            Add Station
          </Button>
        </form>
      </Card>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <div className="mt-6">
        <TableShell>
          <Thead columns={["Name", "Latitude", "Longitude", ""]} />
          <tbody className="divide-y divide-line">
            {loading ? (
              <EmptyRow colSpan={4}>Loading...</EmptyRow>
            ) : stations.length === 0 ? (
              <EmptyRow colSpan={4}>No stations yet — add one above.</EmptyRow>
            ) : (
              stations.map((s) => (
                <tr key={s.id} className="hover:bg-canvas">
                  <td className="px-4 py-3 font-medium text-ink">{s.name}</td>
                  <td className="px-4 py-3 text-muted">{s.latitude}</td>
                  <td className="px-4 py-3 text-muted">{s.longitude}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="danger" onClick={() => handleDelete(s.id)}>
                      <Icon name="delete" size={14} />
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </TableShell>
      </div>
    </div>
  );
}

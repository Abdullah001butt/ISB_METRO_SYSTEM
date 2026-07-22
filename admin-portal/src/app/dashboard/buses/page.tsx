"use client";

import { useEffect, useState, FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import type { Bus, Driver, Route } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { TableShell, Thead, EmptyRow } from "@/components/ui/DataTable";

export default function BusesPage() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [busNumber, setBusNumber] = useState("");
  const [capacity, setCapacity] = useState("40");
  const [submitting, setSubmitting] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkRouteId, setBulkRouteId] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [busesRes, driversRes, routesRes] = await Promise.all([
        api.get<{ buses: Bus[] }>("/api/buses"),
        api.get<{ drivers: Driver[] }>("/api/drivers"),
        api.get<{ routes: Route[] }>("/api/routes"),
      ]);
      setBuses(busesRes.buses);
      setDrivers(driversRes.drivers);
      setRoutes(routesRes.routes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load buses");
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
      await api.post("/api/buses", { busNumber, capacity: Number(capacity) });
      setBusNumber("");
      setCapacity("40");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create bus");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAssign(busId: string, field: "driverId" | "routeId", value: string) {
    try {
      await api.patch(`/api/buses/${busId}/assign`, { [field]: value || null });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to assign");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this bus?")) return;
    try {
      await api.delete(`/api/buses/${id}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete bus");
    }
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === buses.length ? new Set() : new Set(buses.map((b) => b.id))));
  }

  async function handleBulkAssignRoute() {
    setBulkBusy(true);
    setError(null);
    try {
      await Promise.all(
        [...selected].map((busId) =>
          api.patch(`/api/buses/${busId}/assign`, { routeId: bulkRouteId || null })
        )
      );
      setSelected(new Set());
      setBulkRouteId("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to bulk-assign route");
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Buses" description="Fleet, driver and route assignments." />

      <Card>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
          <Field label="Bus Number">
            <Input
              required
              value={busNumber}
              onChange={(e) => setBusNumber(e.target.value)}
              className="w-36"
              placeholder="MB-101"
            />
          </Field>
          <Field label="Capacity">
            <Input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-24"
            />
          </Field>
          <Button type="submit" disabled={submitting}>
            <Icon name="add" size={16} />
            Add Bus
          </Button>
        </form>
      </Card>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {selected.size > 0 && (
        <Card className="mt-4">
          <div className="flex flex-wrap items-end gap-3">
            <p className="text-sm text-ink">{selected.size} bus(es) selected</p>
            <Field label="Assign route to selected">
              <Select value={bulkRouteId} onChange={(e) => setBulkRouteId(e.target.value)} className="w-48">
                <option value="">Unassigned</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Button onClick={handleBulkAssignRoute} disabled={bulkBusy}>
              <Icon name="playlist_add_check" size={15} />
              Apply
            </Button>
            <Button variant="secondary" onClick={() => setSelected(new Set())}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="mt-6">
        <TableShell>
          <Thead
            columns={[
              <input
                key="select-all"
                type="checkbox"
                checked={buses.length > 0 && selected.size === buses.length}
                onChange={toggleSelectAll}
              />,
              "Bus",
              "Capacity",
              "Driver",
              "Route",
              "",
            ]}
          />
          <tbody className="divide-y divide-line">
            {loading ? (
              <EmptyRow colSpan={6}>Loading...</EmptyRow>
            ) : buses.length === 0 ? (
              <EmptyRow colSpan={6}>No buses yet — add one above.</EmptyRow>
            ) : (
              buses.map((b) => (
                <tr key={b.id} className="hover:bg-canvas">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(b.id)}
                      onChange={() => toggleSelected(b.id)}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">{b.busNumber}</td>
                  <td className="px-4 py-3 text-muted">{b.capacity}</td>
                  <td className="px-4 py-3">
                    <Select
                      value={b.driverId ?? ""}
                      onChange={(e) => handleAssign(b.id, "driverId", e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={b.routeId ?? ""}
                      onChange={(e) => handleAssign(b.id, "routeId", e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {routes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="danger" onClick={() => handleDelete(b.id)}>
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

"use client";

import { useEffect, useState, FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import type { Driver } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { TableShell, Thead, EmptyRow } from "@/components/ui/DataTable";

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [cnic, setCnic] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ drivers: Driver[] }>("/api/drivers");
      setDrivers(res.drivers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load drivers");
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
      await api.post("/api/drivers", { name, cnic, phone, password });
      setName("");
      setCnic("");
      setPhone("");
      setPassword("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create driver");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(driver: Driver) {
    try {
      await api.put(`/api/drivers/${driver.id}`, { isActive: !driver.isActive });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update driver");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this driver?")) return;
    try {
      await api.delete(`/api/drivers/${id}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete driver");
    }
  }

  return (
    <div>
      <PageHeader title="Drivers" description="Manage driver accounts and credentials." />

      <Card>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
          <Field label="Name">
            <Input required value={name} onChange={(e) => setName(e.target.value)} className="w-40" />
          </Field>
          <Field label="CNIC">
            <Input required value={cnic} onChange={(e) => setCnic(e.target.value)} className="w-40" />
          </Field>
          <Field label="Phone">
            <Input required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-36" />
          </Field>
          <Field label="Password">
            <Input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-36"
            />
          </Field>
          <Button type="submit" disabled={submitting}>
            <Icon name="add" size={16} />
            Add Driver
          </Button>
        </form>
      </Card>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <div className="mt-6">
        <TableShell>
          <Thead columns={["Name", "CNIC", "Phone", "Status", ""]} />
          <tbody className="divide-y divide-line">
            {loading ? (
              <EmptyRow colSpan={5}>Loading...</EmptyRow>
            ) : drivers.length === 0 ? (
              <EmptyRow colSpan={5}>No drivers yet — add one above.</EmptyRow>
            ) : (
              drivers.map((d) => (
                <tr key={d.id} className="hover:bg-canvas">
                  <td className="px-4 py-3 font-medium text-ink">{d.name}</td>
                  <td className="px-4 py-3 text-muted">{d.cnic}</td>
                  <td className="px-4 py-3 text-muted">{d.phone}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(d)}>
                      <Badge tone={d.isActive ? "green" : "gray"}>
                        {d.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="danger" onClick={() => handleDelete(d.id)}>
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

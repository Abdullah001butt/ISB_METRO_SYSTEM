"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { LiveBus, Station } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";

const LiveMap = dynamic(() => import("@/components/LiveMap").then((m) => m.LiveMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted">
      Loading map...
    </div>
  ),
});

export default function HomePage() {
  const router = useRouter();
  const [stations, setStations] = useState<Station[]>([]);
  const [buses, setBuses] = useState<LiveBus[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [stationsRes, busesRes] = await Promise.all([
          api.get<{ stations: Station[] }>("/api/stations"),
          api.get<{ buses: LiveBus[] }>("/api/live-buses"),
        ]);
        if (cancelled) return;
        setStations(stationsRes.stations);
        setBuses(busesRes.buses);
      } catch {
        // silently ignore — map/section below shows empty state
      }
    }

     
    load();
    const interval = setInterval(load, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return stations.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 6);
  }, [query, stations]);

  const reporting = buses.filter((b) => b.location).length;

  function goToFirst() {
    if (filtered.length > 0) router.push(`/stations/${filtered[0].id}`);
  }

  return (
    <div>
      <section className="border-b border-line bg-linear-to-b from-accent-soft to-canvas">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Track your Metro Bus in real time
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Live locations, arrival estimates, and route information for the Islamabad Metro
            Bus network — no login required.
          </p>

          <div className="relative mx-auto mt-8 max-w-lg">
            <Icon
              name="search"
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && goToFirst()}
              placeholder="Search for a station..."
              className="w-full rounded-full border border-line bg-surface py-3 pl-11 pr-4 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {filtered.length > 0 && (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-line bg-surface text-left shadow-lg">
                {filtered.map((s) => (
                  <Link
                    key={s.id}
                    href={`/stations/${s.id}`}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink/80 hover:bg-canvas"
                  >
                    <Icon name="location_on" size={14} className="text-muted" />
                    {s.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Icon name="sensors" size={16} className="text-accent" />
            Live Bus Map
          </h2>
          <Badge tone={reporting > 0 ? "green" : "gray"}>
            {reporting} of {buses.length} buses live
          </Badge>
        </div>
        <Card padded={false} className="h-120 overflow-hidden">
          <LiveMap buses={buses} stations={stations} />
        </Card>
      </section>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Station } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

export default function StationsPage() {
  const { t } = useLanguage();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api
      .get<{ stations: Station[] }>("/api/stations")
      .then((res) => setStations(res.stations))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stations;
    return stations.filter((s) => s.name.toLowerCase().includes(q));
  }, [query, stations]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold text-ink">{t("stationsTitle")}</h1>
      <p className="mt-1 text-sm text-muted">{t("stationsSubtitle")}</p>

      <div className="relative mt-5">
        <Icon name="search" size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchStations")}
          className="w-full rounded-lg border border-line bg-surface py-2.5 pl-10 pr-4 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="mt-5 space-y-2">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted">{t("loading")}</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">{t("noStationsFound")}</p>
        ) : (
          filtered.map((s) => (
            <Link key={s.id} href={`/stations/${s.id}`}>
              <Card className="flex items-center justify-between transition-shadow hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
                    <Icon name="location_on" size={16} />
                  </div>
                  <span className="text-sm font-medium text-ink">{s.name}</span>
                </div>
                <Icon name="chevron_right" size={16} className="text-muted" />
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

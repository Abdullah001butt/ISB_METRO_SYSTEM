"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFavorites } from "@/lib/useFavorites";
import type { Station } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

function StationRow({
  station,
  isFavorite,
  onToggleFavorite,
}: {
  station: Station;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <Card className="flex items-center justify-between transition-shadow hover:shadow-md">
      <Link href={`/stations/${station.id}`} className="flex flex-1 items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
          <Icon name="location_on" size={16} />
        </div>
        <span className="text-sm font-medium text-ink">{station.name}</span>
      </Link>
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite(station.id);
          }}
          aria-label="Toggle favorite"
          className="p-1.5"
        >
          <Icon
            name="star"
            size={18}
            filled={isFavorite}
            className={isFavorite ? "text-amber-500" : "text-muted"}
          />
        </button>
        <Link href={`/stations/${station.id}`}>
          <Icon name="chevron_right" size={16} className="text-muted" />
        </Link>
      </div>
    </Card>
  );
}

export default function StationsPage() {
  const { t } = useLanguage();
  const { isFavorite, toggle } = useFavorites();
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

  const favoriteStations = filtered.filter((s) => isFavorite(s.id));
  const otherStations = filtered.filter((s) => !isFavorite(s.id));

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

      {loading ? (
        <p className="py-8 text-center text-sm text-muted">{t("loading")}</p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">{t("noStationsFound")}</p>
      ) : (
        <>
          {favoriteStations.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {t("favoriteStations")}
              </p>
              <div className="space-y-2">
                {favoriteStations.map((s) => (
                  <StationRow key={s.id} station={s} isFavorite onToggleFavorite={toggle} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-5">
            {favoriteStations.length > 0 && (
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {t("allStations")}
              </p>
            )}
            <div className="space-y-2">
              {otherStations.map((s) => (
                <StationRow key={s.id} station={s} isFavorite={false} onToggleFavorite={toggle} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useLiveBuses } from "@/lib/useLiveBuses";
import { useFavorites } from "@/lib/useFavorites";
import { useLanguage } from "@/contexts/LanguageContext";
import type { NearestStation, Station } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

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
  const { t } = useLanguage();
  const [stations, setStations] = useState<Station[]>([]);
  const [query, setQuery] = useState("");
  const { buses, source } = useLiveBuses();
  const { favorites } = useFavorites();

  const [locating, setLocating] = useState(false);
  const [nearest, setNearest] = useState<NearestStation[] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api
      .get<{ stations: Station[] }>("/api/stations")
      .then((res) => {
        if (!cancelled) setStations(res.stations);
      })
      .catch(() => {
        // silently ignore — search/map sections show empty state
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return stations.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 6);
  }, [query, stations]);

  const reporting = buses.filter((b) => b.location).length;
  const favoriteStations = stations.filter((s) => favorites.has(s.id));

  function goToFirst() {
    if (filtered.length > 0) router.push(`/stations/${filtered[0].id}`);
  }

  function findNearMe() {
    setLocating(true);
    setLocationError(null);
    setNearest(null);

    if (!navigator.geolocation) {
      setLocationError(t("locationDenied"));
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await api.get<{ stations: NearestStation[] }>(
            `/api/stations/nearest?lat=${position.coords.latitude}&lon=${position.coords.longitude}&limit=5`
          );
          setNearest(res.stations);
        } catch {
          setLocationError(t("locationDenied"));
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocationError(t("locationDenied"));
        setLocating(false);
      }
    );
  }

  return (
    <div>
      <section className="border-b border-line bg-linear-to-b from-accent-soft to-canvas">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{t("heroTitle")}</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted">{t("heroSubtitle")}</p>

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
              placeholder={t("searchPlaceholder")}
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

          <div className="mt-4 flex flex-col items-center gap-3">
            <Button variant="secondary" onClick={findNearMe} disabled={locating}>
              <Icon name="my_location" size={16} />
              {locating ? t("locating") : t("findNearMe")}
            </Button>

            {locationError && <p className="text-sm text-danger">{locationError}</p>}

            {favoriteStations.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {favoriteStations.map((s) => (
                  <Link
                    key={s.id}
                    href={`/stations/${s.id}`}
                    className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink shadow-sm hover:shadow-md"
                  >
                    <Icon name="star" size={13} filled className="text-amber-500" />
                    {s.name}
                  </Link>
                ))}
              </div>
            )}

            {nearest && nearest.length > 0 && (
              <div className="w-full max-w-lg rounded-xl border border-line bg-surface p-3 text-left shadow-sm">
                <p className="mb-2 px-1 text-xs font-semibold text-muted">{t("nearestStations")}</p>
                <div className="space-y-1">
                  {nearest.map((s) => (
                    <Link
                      key={s.id}
                      href={`/stations/${s.id}`}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-canvas"
                    >
                      <span className="flex items-center gap-2 text-ink">
                        <Icon name="location_on" size={14} className="text-accent" />
                        {s.name}
                      </span>
                      <span className="text-xs text-muted">
                        {s.distanceKm} km {t("away")}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Icon name="sensors" size={16} className="text-accent" />
            {t("liveBusMap")}
          </h2>
          <div className="flex items-center gap-2">
            <Badge tone={source === "websocket" ? "green" : "gray"}>
              {source === "websocket" ? t("realTime") : t("polling")}
            </Badge>
            <Badge tone={reporting > 0 ? "green" : "gray"}>
              {reporting} / {buses.length} {t("busesLive")}
            </Badge>
          </div>
        </div>
        <Card padded={false} className="h-80 overflow-hidden sm:h-120">
          <LiveMap buses={buses} stations={stations} />
        </Card>
      </section>
    </div>
  );
}

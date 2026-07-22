"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Station, LiveBus, BatchEtaResponse, BatchEtaEntry, Route } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { LiveCountdown } from "@/components/ui/LiveCountdown";
import { usePushSubscription } from "@/lib/usePushSubscription";

type BusWithEta = LiveBus & { eta: BatchEtaEntry | null };

const crowdTone = { LOW: "green", MEDIUM: "yellow", HIGH: "red" } as const;

export default function StationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = usePromise(params);
  const { t } = useLanguage();
  const push = usePushSubscription(id);
  const [station, setStation] = useState<Station | null>(null);
  const [buses, setBuses] = useState<BusWithEta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [stationRes, routesRes, liveBusesRes] = await Promise.all([
          api.get<{ station: Station }>(`/api/stations/${id}`),
          api.get<{ routes: Route[] }>("/api/routes"),
          api.get<{ buses: LiveBus[] }>("/api/live-buses"),
        ]);
        if (cancelled) return;

        const servingRouteIds = new Set(
          routesRes.routes
            .filter((r) => r.busRoutes.some((br) => br.station.id === id))
            .map((r) => r.id)
        );

        const servingBuses = liveBusesRes.buses.filter(
          (b) => b.routeId && servingRouteIds.has(b.routeId)
        );

        let etaByBusId = new Map<string, BatchEtaEntry>();
        if (servingBuses.length > 0) {
          try {
            const batchRes = await api.get<BatchEtaResponse>(
              `/api/eta/batch?stationId=${id}&busIds=${servingBuses.map((b) => b.id).join(",")}`
            );
            etaByBusId = new Map(batchRes.etas.map((e) => [e.busId, e]));
          } catch {
            // leave etaByBusId empty — buses will show "ETA unavailable"
          }
        }

        const withEta = servingBuses.map((bus) => ({
          ...bus,
          eta: etaByBusId.get(bus.id) ?? null,
        }));

        if (cancelled) return;
        setStation(stationRes.station);
        setBuses(withEta.sort((a, b) => (a.eta?.etaMinutes ?? 999) - (b.eta?.etaMinutes ?? 999)));
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load station");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

     
    load();
    const interval = setInterval(load, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/stations" className="flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <Icon name="arrow_back" size={15} />
        {t("backToStations")}
      </Link>

      {loading ? (
        <p className="mt-8 text-center text-sm text-muted">{t("loading")}</p>
      ) : error || !station ? (
        <p className="mt-8 text-center text-sm text-danger">{error ?? t("stationNotFound")}</p>
      ) : (
        <>
          <div className="mt-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-ink">{station.name}</h1>
            {push.supported && (
              <Button
                variant={push.subscribed ? "secondary" : "primary"}
                disabled={push.loading}
                onClick={() => (push.subscribed ? push.unsubscribe() : push.subscribe())}
              >
                <Icon name={push.subscribed ? "notifications_active" : "notifications"} size={16} />
                {push.subscribed ? t("notifyMeActive") : t("notifyMe")}
              </Button>
            )}
          </div>
          {push.error && <p className="mt-1 text-xs text-danger">{push.error}</p>}
          <p className="mt-1 text-sm text-muted">
            {buses.length} {buses.length === 1 ? t("busServing") : t("busesServing")}
          </p>

          <div className="mt-6 space-y-3">
            {buses.length === 0 ? (
              <Card>
                <p className="text-center text-sm text-muted">{t("noBusesEnRoute")}</p>
              </Card>
            ) : (
              buses.map((bus) => (
                <Card key={bus.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
                        <Icon name="directions_bus" size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-ink">{bus.busNumber}</p>
                        <p className="text-xs text-muted">{bus.route?.name}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      {bus.eta?.etaMinutes != null ? (
                        <>
                          <p className="flex items-center justify-end gap-1 text-lg font-bold text-accent-strong tabular-nums">
                            <Icon name="schedule" size={15} />
                            <LiveCountdown etaMinutes={bus.eta.etaMinutes} />
                          </p>
                          <p className="text-xs text-muted">
                            {bus.eta.source === "ai" ? t("aiPrediction") : t("estimated")}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted">{t("etaUnavailable")}</p>
                      )}
                    </div>
                  </div>

                  {bus.crowdLevel && (
                    <div className="mt-3 flex items-center gap-1.5">
                      <Icon name="group" size={13} className="text-muted" />
                      <Badge tone={crowdTone[bus.crowdLevel]}>
                        {bus.crowdLevel} {t("crowdSuffix")}
                      </Badge>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Route } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

const FLAT_FARE_PKR = 30;

export default function FaresPage() {
  const { t } = useLanguage();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ routes: Route[] }>("/api/routes")
      .then((res) => setRoutes(res.routes))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">{t("faresTitle")}</h1>
      <p className="mt-2 text-sm text-muted">{t("faresSubtitle")}</p>

      <Card className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
            <Icon name="payments" size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">{t("flatFareLabel")}</p>
            <p className="text-xs text-muted">{t("fareNote")}</p>
          </div>
        </div>
        <p className="shrink-0 text-2xl font-bold text-accent-strong tabular-nums">Rs {FLAT_FARE_PKR}</p>
      </Card>

      <h2 className="mt-8 text-sm font-semibold text-ink">{t("routesOnNetwork")}</h2>
      <div className="mt-3 space-y-2">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted">{t("loading")}</p>
        ) : (
          routes.map((route) => (
            <Card key={route.id} className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
                  <Icon name="directions_bus" size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{route.name}</p>
                  {route.description && <p className="text-xs text-muted">{route.description}</p>}
                </div>
              </div>
              <span className="shrink-0 text-xs text-muted">
                {route.busRoutes.length} {t("stationsCount")}
              </span>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/translations";

const features: { icon: string; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { icon: "sensors", titleKey: "featLiveTitle", descKey: "featLiveDesc" },
  { icon: "psychology", titleKey: "featAiTitle", descKey: "featAiDesc" },
  { icon: "directions_bus", titleKey: "featRouteTitle", descKey: "featRouteDesc" },
  { icon: "location_on", titleKey: "featNoLoginTitle", descKey: "featNoLoginDesc" },
];

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">{t("aboutTitle")}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">{t("aboutP1")}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted">{t("aboutP2")}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <Card key={f.titleKey}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
              <Icon name={f.icon} size={18} />
            </div>
            <p className="mt-3 text-sm font-semibold text-ink">{t(f.titleKey)}</p>
            <p className="mt-1 text-sm text-muted">{t(f.descKey)}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

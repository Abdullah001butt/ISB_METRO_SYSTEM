"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/translations";

const links: { href: string; key: TranslationKey }[] = [
  { href: "/", key: "navHome" },
  { href: "/stations", key: "navStations" },
  { href: "/planner", key: "navPlanner" },
  { href: "/fares", key: "navFares" },
  { href: "/about", key: "navAbout" },
];

export function Header() {
  const pathname = usePathname();
  const { lang, toggle, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
            <Icon name="directions_bus" size={17} filled />
          </div>
          <span className="text-sm font-semibold text-ink">{t("brandName")}</span>
        </Link>

        <div className="flex items-center gap-1">
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active ? "bg-accent-soft text-accent-strong" : "text-muted hover:bg-canvas"
                  }`}
                >
                  {t(link.key)}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={toggle}
            className="ml-1 flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-muted hover:bg-canvas"
            aria-label="Toggle language"
          >
            <Icon name="translate" size={15} />
            {lang === "en" ? "اردو" : "EN"}
          </button>

          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="ml-1 flex items-center rounded-lg p-1.5 text-muted hover:bg-canvas md:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <Icon name={mobileOpen ? "close" : "menu"} size={20} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-line bg-surface px-4 pb-3 pt-2 md:hidden">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-accent-soft text-accent-strong" : "text-muted hover:bg-canvas"
                }`}
              >
                {t(link.key)}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}

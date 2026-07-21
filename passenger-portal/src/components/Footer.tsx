"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-muted sm:px-6">
        {t("footerText")}
      </div>
    </footer>
  );
}

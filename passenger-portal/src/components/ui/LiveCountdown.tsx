"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Ticks down every second between poll refreshes, instead of showing a
 * static number that only updates every 8s. Re-baselines whenever a fresh
 * etaMinutes value arrives from the parent's poll.
 */
export function LiveCountdown({ etaMinutes }: { etaMinutes: number }) {
  const { t } = useLanguage();
  const [remainingSeconds, setRemainingSeconds] = useState(() => Math.round(etaMinutes * 60));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-baselining from a fresh poll value, not derived render state
    setRemainingSeconds(Math.round(etaMinutes * 60));
  }, [etaMinutes]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  if (minutes === 0) {
    return (
      <span>
        {seconds} {t("secShort")}
      </span>
    );
  }

  return (
    <span>
      {minutes} {t("minShort")} {seconds.toString().padStart(2, "0")} {t("secShort")}
    </span>
  );
}

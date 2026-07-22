"use client";

import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "metrobus_favorite_stations";

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading persisted favorites from localStorage on mount
      setFavorites(new Set(JSON.parse(stored) as string[]));
    }
  }, []);

  const toggle = useCallback((stationId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(stationId)) next.delete(stationId);
      else next.add(stationId);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const isFavorite = useCallback((stationId: string) => favorites.has(stationId), [favorites]);

  return { favorites, toggle, isFavorite };
}

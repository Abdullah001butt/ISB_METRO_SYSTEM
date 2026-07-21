"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Icon } from "@/components/ui/Icon";

type Command = {
  id: string;
  label: string;
  icon: string;
  action: () => void;
};

export function CommandPalette() {
  const router = useRouter();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const commands = useMemo<Command[]>(
    () => [
      { id: "dashboard", label: "Go to Dashboard", icon: "space_dashboard", action: () => router.push("/dashboard") },
      { id: "buses", label: "Go to Buses", icon: "directions_bus", action: () => router.push("/dashboard/buses") },
      { id: "drivers", label: "Go to Drivers", icon: "badge", action: () => router.push("/dashboard/drivers") },
      { id: "routes", label: "Go to Routes", icon: "alt_route", action: () => router.push("/dashboard/routes") },
      { id: "stations", label: "Go to Stations", icon: "location_on", action: () => router.push("/dashboard/stations") },
      { id: "live", label: "Go to Live Tracking", icon: "sensors", action: () => router.push("/dashboard/live") },
      { id: "alerts", label: "Go to Alerts", icon: "notifications", action: () => router.push("/dashboard/alerts") },
      { id: "ai", label: "Go to AI Predictions", icon: "psychology", action: () => router.push("/dashboard/ai") },
      { id: "analytics", label: "Go to Analytics", icon: "monitoring", action: () => router.push("/dashboard/analytics") },
      { id: "logs", label: "Go to Activity Logs", icon: "history", action: () => router.push("/dashboard/logs") },
      { id: "signout", label: "Sign out", icon: "logout", action: () => logout() },
    ],
    [router, logout]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [query, commands]);

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setActiveIndex(0);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    setActiveIndex(0);
  }

  function handleInputKeydown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[activeIndex];
      if (cmd) {
        cmd.action();
        setOpen(false);
      }
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[15vh]" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-lg rounded-2xl border border-line bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
          <Icon name="search" size={18} className="text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleInputKeydown}
            placeholder="Jump to a page or action..."
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
          <kbd className="rounded border border-line px-1.5 py-0.5 text-xs text-muted">Esc</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">No matching commands.</p>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  setOpen(false);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                  i === activeIndex ? "bg-accent-soft text-accent-strong" : "text-ink hover:bg-canvas"
                }`}
              >
                <Icon name={cmd.icon} size={17} />
                {cmd.label}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

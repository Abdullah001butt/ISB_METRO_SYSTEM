"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Icon } from "@/components/ui/Icon";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "space_dashboard" },
  { href: "/dashboard/buses", label: "Buses", icon: "directions_bus" },
  { href: "/dashboard/drivers", label: "Drivers", icon: "badge" },
  { href: "/dashboard/routes", label: "Routes", icon: "alt_route" },
  { href: "/dashboard/stations", label: "Stations", icon: "location_on" },
  { href: "/dashboard/live", label: "Live Tracking", icon: "sensors" },
  { href: "/dashboard/alerts", label: "Alerts", icon: "notifications" },
  { href: "/dashboard/ai", label: "AI Predictions", icon: "psychology" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "monitoring" },
  { href: "/dashboard/logs", label: "Activity Logs", icon: "history" },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { admin, logout } = useAuth();

  return (
    <aside className="flex h-full w-64 flex-col bg-canvas">
      <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
          <Icon name="directions_bus" size={17} filled />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">Metro Bus Admin</p>
          {admin && <p className="truncate text-xs text-muted">{admin.email}</p>}
        </div>
        <button
          onClick={onNavigate}
          className="ml-auto rounded-md p-1 text-muted hover:bg-surface lg:hidden"
          aria-label="Close menu"
        >
          <Icon name="close" size={18} />
        </button>
      </div>

      <div className="px-3 pt-3">
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
          className="flex w-full items-center gap-2.5 rounded-xl border border-line px-3 py-2 text-left text-sm text-muted hover:bg-surface"
        >
          <Icon name="search" size={16} />
          Search
          <kbd className="ml-auto rounded border border-line px-1.5 text-xs">⌘K</kbd>
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent-soft text-accent-strong"
                  : "text-muted hover:bg-surface hover:text-ink"
              }`}
            >
              <Icon name={link.icon} size={19} filled={active} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-muted hover:bg-surface hover:text-ink"
        >
          <Icon name="logout" size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

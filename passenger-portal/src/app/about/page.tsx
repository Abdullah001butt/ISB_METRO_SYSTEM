import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

const features = [
  {
    icon: "sensors",
    title: "Live Tracking",
    description: "See simulated bus positions update in real time across the network.",
  },
  {
    icon: "psychology",
    title: "AI-Powered ETAs",
    description: "Arrival estimates blend live GPS data with predictions from the AI module.",
  },
  {
    icon: "directions_bus",
    title: "Route Information",
    description: "Browse routes, ordered station sequences, and which buses serve each stop.",
  },
  {
    icon: "location_on",
    title: "No Login Required",
    description: "Built for quick access — at a stop, on a phone, or on a station display screen.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">About This Project</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        The Islamabad Metro Bus AI Information System is a prototype transportation platform
        that layers real-time tracking, predictive analytics, and passenger information on top
        of the existing Metro Bus network. This portal is the public-facing passenger
        experience — no registration required.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        This is a functional prototype: GPS, buses, and drivers are simulated. No real hardware,
        live traffic data, or production-scale hosting is used.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <Card key={f.title}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
              <Icon name={f.icon} size={18} />
            </div>
            <p className="mt-3 text-sm font-semibold text-ink">{f.title}</p>
            <p className="mt-1 text-sm text-muted">{f.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

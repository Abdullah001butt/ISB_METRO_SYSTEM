import { ReactNode } from "react";

type Tone = "gray" | "green" | "red" | "yellow" | "blue";

const toneClasses: Record<Tone, string> = {
  gray: "bg-canvas text-muted",
  green: "bg-accent-soft text-accent-strong",
  red: "bg-danger-soft text-danger",
  yellow: "bg-warning-soft text-warning",
  blue: "bg-accent-soft text-accent-strong",
};

export function Badge({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

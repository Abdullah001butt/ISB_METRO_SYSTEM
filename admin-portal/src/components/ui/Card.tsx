import { ReactNode } from "react";

export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface shadow-sm ${
        padded ? "p-5" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

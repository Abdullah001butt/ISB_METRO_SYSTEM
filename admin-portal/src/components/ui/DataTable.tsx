import { ReactNode } from "react";

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-sm">{children}</table>
      </div>
    </div>
  );
}

export function Thead({ columns }: { columns: (string | ReactNode)[] }) {
  return (
    <thead className="bg-canvas">
      <tr>
        {columns.map((col, i) => (
          <th
            key={i}
            className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"
          >
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-muted">
        {children}
      </td>
    </tr>
  );
}

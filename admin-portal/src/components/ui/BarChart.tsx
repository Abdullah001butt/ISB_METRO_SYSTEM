export function BarChart({
  data,
  color = "#059669",
  height = 60,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  if (data.length === 0) {
    return <p className="text-xs text-muted">No data yet.</p>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t"
            style={{
              height: `${Math.max((d.value / max) * (height - 16), 2)}px`,
              backgroundColor: color,
            }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="text-[9px] text-muted">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

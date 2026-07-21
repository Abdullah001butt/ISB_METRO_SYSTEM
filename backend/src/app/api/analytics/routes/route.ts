import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ON_TIME_THRESHOLD_MINUTES = 3;

// Postgres returns NUMERIC/AVG results as strings via the driver to avoid
// precision loss — these row types reflect that rather than assuming `number`.
type SpeedByHourRow = {
  routeId: string;
  hour: number;
  avgSpeedKmh: string | number;
  sampleCount: string | number | bigint;
};

type DelayStatsRow = {
  routeId: string;
  avgDelayMinutes: string | number | null;
  onTimeRatio: string | number | null;
  sampleCount: string | number | bigint;
};

/**
 * Per-route performance analytics, computed from real accumulated GPS and
 * AI prediction history — the "Route Performance Analysis" AI module from
 * the original proposal. Public: this is aggregate operational data, not
 * anything sensitive.
 */
export async function GET() {
  const routes = await prisma.route.findMany({ orderBy: { name: "asc" } });

  if (routes.length === 0) {
    return NextResponse.json({ routes: [] });
  }

  const [speedRows, delayRows] = await Promise.all([
    prisma.$queryRaw<SpeedByHourRow[]>`
      SELECT b."routeId" as "routeId",
             EXTRACT(HOUR FROM g."recordedAt")::int as hour,
             AVG(g.speed) as "avgSpeedKmh",
             COUNT(*) as "sampleCount"
      FROM "GPSLog" g
      JOIN "Bus" b ON b.id = g."busId"
      WHERE g.speed > 1 AND b."routeId" IS NOT NULL
      GROUP BY b."routeId", hour
      ORDER BY b."routeId", hour
    `,
    prisma.$queryRaw<DelayStatsRow[]>`
      SELECT b."routeId" as "routeId",
             AVG(p."predictedDelayMinutes") as "avgDelayMinutes",
             AVG(CASE WHEN p."predictedDelayMinutes" < ${ON_TIME_THRESHOLD_MINUTES} THEN 1.0 ELSE 0.0 END) as "onTimeRatio",
             COUNT(*) as "sampleCount"
      FROM "AIPrediction" p
      JOIN "Bus" b ON b.id = p."busId"
      WHERE b."routeId" IS NOT NULL AND p."predictedDelayMinutes" IS NOT NULL
      GROUP BY b."routeId"
    `,
  ]);

  const speedByRoute = new Map<string, { hour: number; avgSpeedKmh: number; sampleCount: number }[]>();
  for (const row of speedRows) {
    const list = speedByRoute.get(row.routeId) ?? [];
    list.push({
      hour: row.hour,
      avgSpeedKmh: Number(Number(row.avgSpeedKmh).toFixed(1)),
      sampleCount: Number(row.sampleCount),
    });
    speedByRoute.set(row.routeId, list);
  }

  const delayByRoute = new Map(delayRows.map((row) => [row.routeId, row]));

  const result = routes.map((route) => {
    const delayStats = delayByRoute.get(route.id);
    const onTimeRatio = delayStats?.onTimeRatio != null ? Number(delayStats.onTimeRatio) : null;
    const avgDelay = delayStats?.avgDelayMinutes != null ? Number(delayStats.avgDelayMinutes) : null;

    return {
      routeId: route.id,
      routeName: route.name,
      onTimePercentage: onTimeRatio != null ? Number((onTimeRatio * 100).toFixed(1)) : null,
      avgDelayMinutes: avgDelay != null ? Number(avgDelay.toFixed(1)) : null,
      sampleCount: delayStats ? Number(delayStats.sampleCount) : 0,
      speedByHour: (speedByRoute.get(route.id) ?? []).sort((a, b) => a.hour - b.hour),
    };
  });

  return NextResponse.json({ routes: result });
}

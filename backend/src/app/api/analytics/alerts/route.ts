import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

type DailyCountRow = {
  day: Date;
  type: string;
  count: string | number | bigint;
};

type RouteCountRow = {
  routeId: string | null;
  routeName: string | null;
  type: string;
  count: string | number | bigint;
};

type ResolutionRow = {
  type: string;
  avgResolutionMinutes: string | number | null;
  resolvedCount: string | number | bigint;
};

const LOOKBACK_DAYS = 30;

export async function GET(request: NextRequest) {
  const auth = requireRole(request, "admin");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const [dailyRows, routeRows, resolutionRows, openCount] = await Promise.all([
    prisma.$queryRaw<DailyCountRow[]>`
      SELECT DATE_TRUNC('day', "createdAt") as day, type, COUNT(*) as count
      FROM "Alert"
      WHERE "createdAt" >= ${since}
      GROUP BY day, type
      ORDER BY day ASC
    `,
    prisma.$queryRaw<RouteCountRow[]>`
      SELECT r.id as "routeId", r.name as "routeName", a.type, COUNT(*) as count
      FROM "Alert" a
      LEFT JOIN "Bus" b ON b.id = a."busId"
      LEFT JOIN "Route" r ON r.id = b."routeId"
      WHERE a."createdAt" >= ${since}
      GROUP BY r.id, r.name, a.type
      ORDER BY count DESC
    `,
    prisma.$queryRaw<ResolutionRow[]>`
      SELECT type,
             AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / 60) as "avgResolutionMinutes",
             COUNT(*) as "resolvedCount"
      FROM "Alert"
      WHERE "resolvedAt" IS NOT NULL AND "createdAt" >= ${since}
      GROUP BY type
    `,
    prisma.alert.count({ where: { status: { in: ["OPEN", "ACKNOWLEDGED"] } } }),
  ]);

  return NextResponse.json({
    lookbackDays: LOOKBACK_DAYS,
    currentlyOpen: openCount,
    daily: dailyRows.map((row) => ({
      day: row.day,
      type: row.type,
      count: Number(row.count),
    })),
    byRoute: routeRows.map((row) => ({
      routeId: row.routeId,
      routeName: row.routeName ?? "Unassigned",
      type: row.type,
      count: Number(row.count),
    })),
    resolution: resolutionRows.map((row) => ({
      type: row.type,
      avgResolutionMinutes:
        row.avgResolutionMinutes != null ? Number(Number(row.avgResolutionMinutes).toFixed(1)) : null,
      resolvedCount: Number(row.resolvedCount),
    })),
  });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

type DriverStatsRow = {
  driverId: string;
  tripsCompleted: string | number | bigint;
  totalDurationMinutes: string | number | null;
};

type AlertCountRow = {
  driverId: string;
  alertCount: string | number | bigint;
};

/**
 * Per-driver activity summary. Distance is intentionally left out here —
 * computing it precisely means walking every GPS point of every trip for
 * every driver, which doesn't scale as a dashboard aggregate. A driver's own
 * app already shows exact per-trip distance (GET /api/driver/trips); this
 * endpoint is for relative activity comparison, not billing-grade totals.
 */
export async function GET(request: NextRequest) {
  const auth = requireRole(request, "admin");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const drivers = await prisma.driver.findMany({
    select: { id: true, name: true, isActive: true },
    orderBy: { name: "asc" },
  });

  const [tripRows, alertRows] = await Promise.all([
    prisma.$queryRaw<DriverStatsRow[]>`
      SELECT "driverId",
             COUNT(*) as "tripsCompleted",
             SUM(EXTRACT(EPOCH FROM ("endedAt" - "startedAt")) / 60) as "totalDurationMinutes"
      FROM "Trip"
      WHERE status = 'COMPLETED' AND "startedAt" IS NOT NULL AND "endedAt" IS NOT NULL
      GROUP BY "driverId"
    `,
    prisma.$queryRaw<AlertCountRow[]>`
      SELECT b."driverId" as "driverId", COUNT(*) as "alertCount"
      FROM "Alert" a
      JOIN "Bus" b ON b.id = a."busId"
      WHERE b."driverId" IS NOT NULL AND a.type != 'EMERGENCY'
      GROUP BY b."driverId"
    `,
  ]);

  const tripsByDriver = new Map(tripRows.map((row) => [row.driverId, row]));
  const alertsByDriver = new Map(alertRows.map((row) => [row.driverId, Number(row.alertCount)]));

  const result = drivers.map((driver) => {
    const stats = tripsByDriver.get(driver.id);
    return {
      driverId: driver.id,
      driverName: driver.name,
      isActive: driver.isActive,
      tripsCompleted: stats ? Number(stats.tripsCompleted) : 0,
      totalDurationMinutes: stats?.totalDurationMinutes != null ? Math.round(Number(stats.totalDurationMinutes)) : 0,
      alertCount: alertsByDriver.get(driver.id) ?? 0,
    };
  });

  return NextResponse.json({ drivers: result });
}

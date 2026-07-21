import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { publicDriverSelect } from "@/lib/selects";

type LatestGps = {
  busId: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  recordedAt: Date;
};

type LatestCrowd = {
  busId: string;
  level: "LOW" | "MEDIUM" | "HIGH";
};

export async function GET() {
  const buses = await prisma.bus.findMany({
    where: { isActive: true },
    include: { driver: { select: publicDriverSelect }, route: true },
    orderBy: { busNumber: "asc" },
  });

  if (buses.length === 0) {
    return NextResponse.json({ buses: [] });
  }

  const busIds = buses.map((b) => b.id);

  // One query each for "latest GPS per bus" and "latest crowd status per bus"
  // (via Postgres's DISTINCT ON), instead of looping and querying per bus —
  // this stays at 3 queries total regardless of fleet size.
  const [latestGpsRows, latestCrowdRows] = await Promise.all([
    prisma.$queryRaw<LatestGps[]>`
      SELECT DISTINCT ON ("busId") "busId", latitude, longitude, speed, "recordedAt"
      FROM "GPSLog"
      WHERE "busId" IN (${Prisma.join(busIds)})
      ORDER BY "busId", "recordedAt" DESC
    `,
    prisma.$queryRaw<LatestCrowd[]>`
      SELECT DISTINCT ON ("busId") "busId", level
      FROM "CrowdStatus"
      WHERE "busId" IN (${Prisma.join(busIds)})
      ORDER BY "busId", "recordedAt" DESC
    `,
  ]);

  const gpsByBusId = new Map(latestGpsRows.map((row) => [row.busId, row]));
  const crowdByBusId = new Map(latestCrowdRows.map((row) => [row.busId, row.level]));

  const liveBuses = buses.map((bus) => {
    const gps = gpsByBusId.get(bus.id);
    return {
      ...bus,
      location: gps
        ? {
            latitude: gps.latitude,
            longitude: gps.longitude,
            speed: gps.speed,
            recordedAt: gps.recordedAt,
          }
        : null,
      crowdLevel: crowdByBusId.get(bus.id) ?? null,
    };
  });

  return NextResponse.json({ buses: liveBuses });
}

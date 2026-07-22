import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { haversineDistanceKm } from "@/lib/geo";

// Guards against GPS points that can't reflect real bus movement — e.g. a
// fleet-simulator process still driving the same bus in parallel with a real
// driver's phone, which produces huge instantaneous jumps between the two
// sources. Anything implying a speed above this is treated as a data glitch,
// not travel, and excluded from the distance sum.
const MAX_PLAUSIBLE_SPEED_KMH = 140;

export async function GET(request: NextRequest) {
  const auth = requireRole(request, "driver");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trips = await prisma.trip.findMany({
    where: { driverId: auth.sub, status: "COMPLETED" },
    orderBy: { startedAt: "desc" },
    take: 30,
    include: {
      bus: { select: { busNumber: true } },
      route: { select: { name: true } },
    },
  });

  const withDistance = await Promise.all(
    trips.map(async (trip) => {
      let distanceKm = 0;
      if (trip.startedAt && trip.endedAt) {
        const logs = await prisma.gPSLog.findMany({
          where: {
            busId: trip.busId,
            recordedAt: { gte: trip.startedAt, lte: trip.endedAt },
          },
          orderBy: { recordedAt: "asc" },
          select: { latitude: true, longitude: true, recordedAt: true },
        });
        for (let i = 1; i < logs.length; i++) {
          const segmentKm = haversineDistanceKm(
            logs[i - 1].latitude,
            logs[i - 1].longitude,
            logs[i].latitude,
            logs[i].longitude
          );
          const hours =
            (logs[i].recordedAt.getTime() - logs[i - 1].recordedAt.getTime()) / 3_600_000;
          const impliedSpeedKmh = hours > 0 ? segmentKm / hours : Infinity;
          if (impliedSpeedKmh <= MAX_PLAUSIBLE_SPEED_KMH) {
            distanceKm += segmentKm;
          }
        }
      }

      const durationMinutes =
        trip.startedAt && trip.endedAt
          ? Math.round((trip.endedAt.getTime() - trip.startedAt.getTime()) / 60000)
          : null;

      return {
        id: trip.id,
        busNumber: trip.bus.busNumber,
        routeName: trip.route.name,
        startedAt: trip.startedAt,
        endedAt: trip.endedAt,
        durationMinutes,
        distanceKm: Number(distanceKm.toFixed(2)),
      };
    })
  );

  return NextResponse.json({ trips: withDistance });
}

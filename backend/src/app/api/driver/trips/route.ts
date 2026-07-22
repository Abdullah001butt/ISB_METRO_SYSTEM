import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { computeTripDistanceKm } from "@/lib/tripDistance";

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
        distanceKm = computeTripDistanceKm(logs);
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

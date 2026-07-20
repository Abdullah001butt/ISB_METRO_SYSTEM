import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicDriverSelect } from "@/lib/selects";

export async function GET() {
  const buses = await prisma.bus.findMany({
    where: { isActive: true },
    include: { driver: { select: publicDriverSelect }, route: true },
    orderBy: { busNumber: "asc" },
  });

  const liveBuses = await Promise.all(
    buses.map(async (bus) => {
      const [lastGps, lastCrowd] = await Promise.all([
        prisma.gPSLog.findFirst({
          where: { busId: bus.id },
          orderBy: { recordedAt: "desc" },
        }),
        prisma.crowdStatus.findFirst({
          where: { busId: bus.id },
          orderBy: { recordedAt: "desc" },
        }),
      ]);

      return {
        ...bus,
        location: lastGps
          ? {
              latitude: lastGps.latitude,
              longitude: lastGps.longitude,
              speed: lastGps.speed,
              recordedAt: lastGps.recordedAt,
            }
          : null,
        crowdLevel: lastCrowd?.level ?? null,
      };
    })
  );

  return NextResponse.json({ buses: liveBuses });
}

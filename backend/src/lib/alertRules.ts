import { prisma } from "@/lib/prisma";
import { distanceToPolylineKm } from "@/lib/geo";

const DEVIATION_THRESHOLD_KM = 0.8;
const DELAY_SPEED_THRESHOLD_KMH = 2;
const DELAY_MIN_STALLED_MINUTES = 5;
const DELAY_MIN_SAMPLES = 3;

async function openOrCreateAlert(
  busId: string,
  type: "ROUTE_DEVIATION" | "DELAY",
  message: string
) {
  const existing = await prisma.alert.findFirst({
    where: { busId, type, status: { in: ["OPEN", "ACKNOWLEDGED"] } },
  });
  if (existing) return;

  await prisma.alert.create({ data: { busId, type, message } });
}

async function autoResolveAlert(busId: string, type: "ROUTE_DEVIATION" | "DELAY") {
  await prisma.alert.updateMany({
    where: { busId, type, status: { in: ["OPEN", "ACKNOWLEDGED"] } },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });
}

export async function evaluateRouteDeviation(
  busId: string,
  point: { latitude: number; longitude: number }
) {
  const bus = await prisma.bus.findUnique({
    where: { id: busId },
    include: {
      route: {
        include: { busRoutes: { include: { station: true }, orderBy: { sequence: "asc" } } },
      },
    },
  });

  if (!bus?.route) return;

  const stations = bus.route.busRoutes.map((br) => br.station);
  const distance = distanceToPolylineKm(point, stations);
  if (distance === null) return;

  if (distance > DEVIATION_THRESHOLD_KM) {
    await openOrCreateAlert(
      busId,
      "ROUTE_DEVIATION",
      `Bus is ${distance.toFixed(2)}km off route "${bus.route.name}"`
    );
  } else {
    await autoResolveAlert(busId, "ROUTE_DEVIATION");
  }
}

export async function evaluateDelay(busId: string) {
  const recentLogs = await prisma.gPSLog.findMany({
    where: { busId },
    orderBy: { recordedAt: "desc" },
    take: DELAY_MIN_SAMPLES,
  });

  if (recentLogs.length < DELAY_MIN_SAMPLES) return;

  const allStalled = recentLogs.every(
    (log) => log.speed !== null && log.speed < DELAY_SPEED_THRESHOLD_KMH
  );

  const oldest = recentLogs[recentLogs.length - 1];
  const newest = recentLogs[0];
  const spanMinutes = (newest.recordedAt.getTime() - oldest.recordedAt.getTime()) / 60000;

  if (allStalled && spanMinutes >= DELAY_MIN_STALLED_MINUTES) {
    await openOrCreateAlert(
      busId,
      "DELAY",
      `Bus has been stalled (<${DELAY_SPEED_THRESHOLD_KMH}km/h) for ${spanMinutes.toFixed(1)} minutes`
    );
  } else {
    await autoResolveAlert(busId, "DELAY");
  }
}

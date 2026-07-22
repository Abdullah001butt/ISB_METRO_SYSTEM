import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineDistanceKm } from "@/lib/geo";
import { sendPush } from "@/lib/push";

const ETA_THRESHOLD_MINUTES = 5;
const RENOTIFY_COOLDOWN_MS = 20 * 60 * 1000;
const DEFAULT_AVG_SPEED_KMH = 25;

/**
 * Triggered periodically by the always-on ws-server (Vercel functions can't
 * run their own background timers). For every station with an active push
 * subscription, checks whether any bus serving that station is within
 * ETA_THRESHOLD_MINUTES and, if so, sends a "bus approaching" push —
 * throttled per subscription so it fires once per approach, not every tick.
 */
export async function POST() {
  const subscriptions = await prisma.pushSubscription.findMany({ include: { station: true } });
  if (subscriptions.length === 0) {
    return NextResponse.json({ checked: 0, notified: 0 });
  }

  const stationIds = [...new Set(subscriptions.map((s) => s.stationId))];

  const busRoutes = await prisma.busRoute.findMany({
    where: { stationId: { in: stationIds } },
    select: { stationId: true, routeId: true },
  });
  const routeIdsByStation = new Map<string, Set<string>>();
  for (const br of busRoutes) {
    const set = routeIdsByStation.get(br.stationId) ?? new Set();
    set.add(br.routeId);
    routeIdsByStation.set(br.stationId, set);
  }

  const allRouteIds = [...new Set(busRoutes.map((br) => br.routeId))];
  const buses = await prisma.bus.findMany({
    where: { routeId: { in: allRouteIds }, isActive: true },
    select: { id: true, routeId: true },
  });

  const latestGps = await prisma.gPSLog.findMany({
    where: { busId: { in: buses.map((b) => b.id) } },
    orderBy: { recordedAt: "desc" },
    distinct: ["busId"],
    select: { busId: true, latitude: true, longitude: true, speed: true },
  });
  const gpsByBusId = new Map(latestGps.map((g) => [g.busId, g]));

  let notified = 0;
  const now = new Date();

  for (const sub of subscriptions) {
    if (sub.lastNotifiedAt && now.getTime() - sub.lastNotifiedAt.getTime() < RENOTIFY_COOLDOWN_MS) {
      continue;
    }

    const routeIds = routeIdsByStation.get(sub.stationId) ?? new Set();
    const busesOnRoute = buses.filter((b) => b.routeId && routeIds.has(b.routeId));

    let closestEtaMinutes: number | null = null;
    for (const bus of busesOnRoute) {
      const gps = gpsByBusId.get(bus.id);
      if (!gps) continue;
      const distanceKm = haversineDistanceKm(
        gps.latitude,
        gps.longitude,
        sub.station.latitude,
        sub.station.longitude
      );
      const speedKmh = gps.speed && gps.speed > 1 ? gps.speed : DEFAULT_AVG_SPEED_KMH;
      const etaMinutes = (distanceKm / speedKmh) * 60;
      if (closestEtaMinutes === null || etaMinutes < closestEtaMinutes) {
        closestEtaMinutes = etaMinutes;
      }
    }

    if (closestEtaMinutes !== null && closestEtaMinutes <= ETA_THRESHOLD_MINUTES) {
      const result = await sendPush(sub, {
        title: "Bus approaching",
        body: `A bus is about ${Math.max(1, Math.round(closestEtaMinutes))} min from ${sub.station.name}.`,
        tag: `station-${sub.stationId}`,
      });

      if (result.gone) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
      } else if (result.ok) {
        notified++;
        await prisma.pushSubscription.update({ where: { id: sub.id }, data: { lastNotifiedAt: now } });
      }
    }
  }

  return NextResponse.json({ checked: subscriptions.length, notified });
}

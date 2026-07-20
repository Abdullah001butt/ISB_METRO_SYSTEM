import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineDistanceKm } from "@/lib/geo";

const DEFAULT_AVG_SPEED_KMH = 25;
const AI_PREDICTION_MAX_AGE_MS = 2 * 60 * 1000;

export async function GET(request: NextRequest) {
  const busId = request.nextUrl.searchParams.get("busId");
  const stationId = request.nextUrl.searchParams.get("stationId");

  if (!busId || !stationId) {
    return NextResponse.json(
      { error: "busId and stationId query params are required" },
      { status: 400 }
    );
  }

  const station = await prisma.station.findUnique({ where: { id: stationId } });
  if (!station) {
    return NextResponse.json({ error: "Station not found" }, { status: 404 });
  }

  const recentPrediction = await prisma.aIPrediction.findFirst({
    where: {
      busId,
      stationId,
      createdAt: { gte: new Date(Date.now() - AI_PREDICTION_MAX_AGE_MS) },
      predictedEtaMinutes: { not: null },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recentPrediction) {
    return NextResponse.json({
      busId,
      stationId,
      etaMinutes: recentPrediction.predictedEtaMinutes,
      delayMinutes: recentPrediction.predictedDelayMinutes,
      source: "ai",
      predictedAt: recentPrediction.createdAt,
    });
  }

  const lastGps = await prisma.gPSLog.findFirst({
    where: { busId },
    orderBy: { recordedAt: "desc" },
  });

  if (!lastGps) {
    return NextResponse.json({ error: "No GPS data available for this bus" }, { status: 404 });
  }

  const distanceKm = haversineDistanceKm(
    lastGps.latitude,
    lastGps.longitude,
    station.latitude,
    station.longitude
  );

  const speedKmh =
    lastGps.speed && lastGps.speed > 1 ? lastGps.speed : DEFAULT_AVG_SPEED_KMH;

  const etaMinutes = (distanceKm / speedKmh) * 60;

  return NextResponse.json({
    busId,
    stationId,
    distanceKm: Number(distanceKm.toFixed(2)),
    etaMinutes: Number(etaMinutes.toFixed(1)),
    source: "rule-based",
    basedOn: { latitude: lastGps.latitude, longitude: lastGps.longitude, recordedAt: lastGps.recordedAt },
  });
}

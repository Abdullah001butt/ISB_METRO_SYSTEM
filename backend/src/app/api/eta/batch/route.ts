import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { haversineDistanceKm } from "@/lib/geo";

const DEFAULT_AVG_SPEED_KMH = 25;
const AI_PREDICTION_MAX_AGE_MS = 2 * 60 * 1000;

type PredictionRow = {
  busId: string;
  predictedEtaMinutes: number | null;
  predictedDelayMinutes: number | null;
  createdAt: Date;
};

type GpsRow = {
  busId: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  recordedAt: Date;
};

/**
 * Batch version of GET /api/eta — one request for N buses instead of N
 * requests, each of which previously ran its own set of queries. Used by the
 * passenger portal's station detail page, which needs an ETA per bus serving
 * that station.
 */
export async function GET(request: NextRequest) {
  const stationId = request.nextUrl.searchParams.get("stationId");
  const busIdsParam = request.nextUrl.searchParams.get("busIds");

  if (!stationId || !busIdsParam) {
    return NextResponse.json(
      { error: "stationId and busIds query params are required" },
      { status: 400 }
    );
  }

  const busIds = busIdsParam.split(",").filter(Boolean);
  if (busIds.length === 0) {
    return NextResponse.json({ stationId, etas: [] });
  }

  const station = await prisma.station.findUnique({ where: { id: stationId } });
  if (!station) {
    return NextResponse.json({ error: "Station not found" }, { status: 404 });
  }

  const [predictionRows, gpsRows] = await Promise.all([
    prisma.$queryRaw<PredictionRow[]>`
      SELECT DISTINCT ON ("busId") "busId", "predictedEtaMinutes", "predictedDelayMinutes", "createdAt"
      FROM "AIPrediction"
      WHERE "busId" IN (${Prisma.join(busIds)})
        AND "stationId" = ${stationId}
        AND "predictedEtaMinutes" IS NOT NULL
        AND "createdAt" >= ${new Date(Date.now() - AI_PREDICTION_MAX_AGE_MS)}
      ORDER BY "busId", "createdAt" DESC
    `,
    prisma.$queryRaw<GpsRow[]>`
      SELECT DISTINCT ON ("busId") "busId", latitude, longitude, speed, "recordedAt"
      FROM "GPSLog"
      WHERE "busId" IN (${Prisma.join(busIds)})
      ORDER BY "busId", "recordedAt" DESC
    `,
  ]);

  const predictionByBusId = new Map(predictionRows.map((row) => [row.busId, row]));
  const gpsByBusId = new Map(gpsRows.map((row) => [row.busId, row]));

  const etas = busIds.map((busId) => {
    const prediction = predictionByBusId.get(busId);
    if (prediction) {
      return {
        busId,
        stationId,
        etaMinutes: prediction.predictedEtaMinutes,
        delayMinutes: prediction.predictedDelayMinutes,
        source: "ai" as const,
        predictedAt: prediction.createdAt,
      };
    }

    const gps = gpsByBusId.get(busId);
    if (!gps) {
      return { busId, stationId, etaMinutes: null, source: null };
    }

    const distanceKm = haversineDistanceKm(gps.latitude, gps.longitude, station.latitude, station.longitude);
    const speedKmh = gps.speed && gps.speed > 1 ? gps.speed : DEFAULT_AVG_SPEED_KMH;
    const etaMinutes = (distanceKm / speedKmh) * 60;

    return {
      busId,
      stationId,
      distanceKm: Number(distanceKm.toFixed(2)),
      etaMinutes: Number(etaMinutes.toFixed(1)),
      source: "rule-based" as const,
      basedOn: { latitude: gps.latitude, longitude: gps.longitude, recordedAt: gps.recordedAt },
    };
  });

  return NextResponse.json({ stationId, etas });
}

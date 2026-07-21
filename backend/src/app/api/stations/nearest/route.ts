import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineDistanceKm } from "@/lib/geo";

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lon = Number(request.nextUrl.searchParams.get("lon"));
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 5, 20);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "lat and lon query params are required" }, { status: 400 });
  }

  const stations = await prisma.station.findMany();

  const withDistance = stations
    .map((station) => ({
      ...station,
      distanceKm: Number(haversineDistanceKm(lat, lon, station.latitude, station.longitude).toFixed(2)),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);

  return NextResponse.json({ stations: withDistance });
}

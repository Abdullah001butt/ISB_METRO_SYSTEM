import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = requireRole(request, "passenger");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favorites = await prisma.passengerFavoriteStation.findMany({
    where: { passengerId: auth.sub },
    select: { station: { select: { id: true, name: true, latitude: true, longitude: true } } },
  });

  return NextResponse.json({ stations: favorites.map((f) => f.station) });
}

const bodySchema = z.object({ stationId: z.string() });

export async function POST(request: NextRequest) {
  const auth = requireRole(request, "passenger");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const station = await prisma.station.findUnique({ where: { id: parsed.data.stationId } });
  if (!station) {
    return NextResponse.json({ error: "Station not found" }, { status: 404 });
  }

  await prisma.passengerFavoriteStation.upsert({
    where: { passengerId_stationId: { passengerId: auth.sub, stationId: station.id } },
    create: { passengerId: auth.sub, stationId: station.id },
    update: {},
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = requireRole(request, "passenger");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  await prisma.passengerFavoriteStation.deleteMany({
    where: { passengerId: auth.sub, stationId: parsed.data.stationId },
  });

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, stopRequestRateLimit } from "@/lib/rateLimit";

const bodySchema = z.object({
  busId: z.string(),
  stationId: z.string(),
});

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, stopRequestRateLimit);
  if (limited) return limited;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { busId, stationId } = parsed.data;

  const [bus, station] = await Promise.all([
    prisma.bus.findUnique({ where: { id: busId } }),
    prisma.station.findUnique({ where: { id: stationId } }),
  ]);
  if (!bus) return NextResponse.json({ error: "Bus not found" }, { status: 404 });
  if (!station) return NextResponse.json({ error: "Station not found" }, { status: 404 });

  const stopRequest = await prisma.stopRequest.create({
    data: { busId, stationId },
  });

  return NextResponse.json({ stopRequest }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { enforceRateLimit, writeRateLimit } from "@/lib/rateLimit";

const bodySchema = z.object({
  tripId: z.string(),
});

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, writeRateLimit);
  if (limited) return limited;

  const auth = requireRole(request, "driver");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { tripId } = parsed.data;

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip || trip.driverId !== auth.sub) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const updated = await prisma.trip.update({
    where: { id: tripId },
    data: { status: "COMPLETED", endedAt: new Date() },
  });

  return NextResponse.json({ trip: updated });
}

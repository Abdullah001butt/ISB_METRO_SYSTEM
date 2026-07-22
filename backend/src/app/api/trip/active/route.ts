import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Bus IDs currently under a real driver's active trip. Public and minimal
 * (just IDs, no driver/location detail) — the fleet simulator polls this so
 * it can stand down for a bus once a real phone takes over, instead of both
 * sources fighting over the same bus's GPS trail.
 */
export async function GET() {
  const trips = await prisma.trip.findMany({
    where: { status: "IN_PROGRESS" },
    select: { busId: true },
  });
  return NextResponse.json({ busIds: [...new Set(trips.map((t) => t.busId))] });
}

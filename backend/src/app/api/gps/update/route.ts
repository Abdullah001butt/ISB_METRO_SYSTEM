import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { evaluateRouteDeviation, evaluateDelay } from "@/lib/alertRules";

const bodySchema = z.object({
  busId: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  speed: z.number().nonnegative().optional(),
});

export async function POST(request: NextRequest) {
  const auth = requireRole(request, "driver");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { busId, latitude, longitude, speed } = parsed.data;

  const bus = await prisma.bus.findUnique({ where: { id: busId } });
  if (!bus || bus.driverId !== auth.sub) {
    return NextResponse.json({ error: "Bus not assigned to this driver" }, { status: 403 });
  }

  const gpsLog = await prisma.gPSLog.create({
    data: { busId, latitude, longitude, speed },
  });

  await Promise.all([
    evaluateRouteDeviation(busId, { latitude, longitude }),
    evaluateDelay(busId),
  ]);

  return NextResponse.json({ gpsLog }, { status: 201 });
}

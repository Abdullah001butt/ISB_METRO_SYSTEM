import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { enforceRateLimit, writeRateLimit } from "@/lib/rateLimit";

const bodySchema = z.object({
  busId: z.string(),
  level: z.enum(["LOW", "MEDIUM", "HIGH"]),
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

  const { busId, level } = parsed.data;

  const bus = await prisma.bus.findUnique({ where: { id: busId } });
  if (!bus || bus.driverId !== auth.sub) {
    return NextResponse.json({ error: "Bus not assigned to this driver" }, { status: 403 });
  }

  const crowdStatus = await prisma.crowdStatus.create({ data: { busId, level } });

  return NextResponse.json({ crowdStatus }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";
import { enforceRateLimit, writeRateLimit } from "@/lib/rateLimit";

const bodySchema = z.object({
  message: z.string().min(1).max(280),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const limited = await enforceRateLimit(request, writeRateLimit);
  if (limited) return limited;

  const auth = requireRole(request, "admin");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  const message = await prisma.driverMessage.create({
    data: { driverId: id, message: parsed.data.message },
  });

  await logActivity(auth.sub, "driver.message", `Messaged driver "${driver.name}" (${driver.id})`);

  return NextResponse.json({ message }, { status: 201 });
}

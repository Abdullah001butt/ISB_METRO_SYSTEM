import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const bodySchema = z.object({
  reply: z.string().max(140).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, "driver");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const stopRequest = await prisma.stopRequest.findUnique({ where: { id }, include: { bus: true } });
  if (!stopRequest) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (stopRequest.bus.driverId !== auth.sub) {
    return NextResponse.json({ error: "Bus not assigned to this driver" }, { status: 403 });
  }

  const updated = await prisma.stopRequest.update({
    where: { id },
    data: {
      status: "ACKNOWLEDGED",
      driverReply: parsed.data.reply?.trim() || "On my way",
      respondedAt: new Date(),
    },
  });

  return NextResponse.json({ stopRequest: updated });
}

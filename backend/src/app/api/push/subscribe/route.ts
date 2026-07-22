import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, writeRateLimit } from "@/lib/rateLimit";

const bodySchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
  stationId: z.string(),
});

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, writeRateLimit);
  if (limited) return limited;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { endpoint, keys, stationId } = parsed.data;

  const station = await prisma.station.findUnique({ where: { id: stationId } });
  if (!station) {
    return NextResponse.json({ error: "Station not found" }, { status: 404 });
  }

  const subscription = await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, stationId },
    update: { p256dh: keys.p256dh, auth: keys.auth, stationId, lastNotifiedAt: null },
  });

  return NextResponse.json({ subscription: { id: subscription.id } }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const parsed = z.object({ endpoint: z.string().url() }).safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({ where: { endpoint: parsed.data.endpoint } });
  return NextResponse.json({ success: true });
}

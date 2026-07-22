import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { enforceRateLimit, emergencyRateLimit } from "@/lib/rateLimit";

const MAX_PHOTO_DATA_URL_LENGTH = 2_000_000; // ~1.5MB decoded, generous for a compressed JPEG

const bodySchema = z.object({
  busId: z.string(),
  message: z.string().max(280).optional(),
  photoDataUrl: z
    .string()
    .startsWith("data:image/")
    .max(MAX_PHOTO_DATA_URL_LENGTH)
    .optional(),
});

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, emergencyRateLimit);
  if (limited) return limited;

  const auth = requireRole(request, "driver");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { busId, message, photoDataUrl } = parsed.data;

  const bus = await prisma.bus.findUnique({ where: { id: busId } });
  if (!bus || bus.driverId !== auth.sub) {
    return NextResponse.json({ error: "Bus not assigned to this driver" }, { status: 403 });
  }

  const alert = await prisma.alert.create({
    data: {
      busId,
      type: "EMERGENCY",
      message: message?.trim() ? message.trim() : `Emergency reported by driver on bus ${bus.busNumber}`,
      photoDataUrl,
    },
  });

  return NextResponse.json({ alert }, { status: 201 });
}

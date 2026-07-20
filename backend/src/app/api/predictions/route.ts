import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isValidAiServiceKey } from "@/lib/aiAuth";

const createSchema = z.object({
  busId: z.string(),
  stationId: z.string().optional(),
  predictedEtaMinutes: z.number().nonnegative().optional(),
  predictedDelayMinutes: z.number().optional(),
});

export async function GET(request: NextRequest) {
  const busId = request.nextUrl.searchParams.get("busId") ?? undefined;
  const stationId = request.nextUrl.searchParams.get("stationId") ?? undefined;

  const predictions = await prisma.aIPrediction.findMany({
    where: { busId, stationId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ predictions });
}

export async function POST(request: NextRequest) {
  if (!isValidAiServiceKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const prediction = await prisma.aIPrediction.create({ data: parsed.data });
  return NextResponse.json({ prediction }, { status: 201 });
}

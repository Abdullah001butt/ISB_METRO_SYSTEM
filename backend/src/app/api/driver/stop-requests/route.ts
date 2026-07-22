import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = requireRole(request, "driver");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const buses = await prisma.bus.findMany({ where: { driverId: auth.sub }, select: { id: true } });
  const busIds = buses.map((b) => b.id);

  const stopRequests = await prisma.stopRequest.findMany({
    where: { busId: { in: busIds }, status: "PENDING" },
    include: { station: true },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  return NextResponse.json({ stopRequests });
}

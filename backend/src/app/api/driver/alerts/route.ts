import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = requireRole(request, "driver");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const busId = request.nextUrl.searchParams.get("busId");
  if (!busId) {
    return NextResponse.json({ error: "busId is required" }, { status: 400 });
  }

  const bus = await prisma.bus.findUnique({ where: { id: busId } });
  if (!bus || bus.driverId !== auth.sub) {
    return NextResponse.json({ error: "Bus not assigned to this driver" }, { status: 403 });
  }

  const alerts = await prisma.alert.findMany({
    where: { busId, status: { in: ["OPEN", "ACKNOWLEDGED"] } },
    orderBy: { createdAt: "desc" },
    select: { id: true, type: true, status: true, message: true, createdAt: true },
  });

  return NextResponse.json({ alerts });
}

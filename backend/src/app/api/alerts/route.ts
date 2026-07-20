import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!requireRole(request, "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("status");

  const alerts = await prisma.alert.findMany({
    where: status ? { status: status as "OPEN" | "ACKNOWLEDGED" | "RESOLVED" } : undefined,
    include: { bus: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ alerts });
}

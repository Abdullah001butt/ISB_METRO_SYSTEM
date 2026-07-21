import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Minimal, unauthenticated view of open alerts — used by the WebSocket relay
 * (which has no admin credentials) to broadcast live alert notifications to
 * connected clients. Deliberately excludes anything the full /api/alerts
 * admin endpoint exposes beyond what's needed for a toast notification.
 */
export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") ?? "OPEN";

  const alerts = await prisma.alert.findMany({
    where: { status: status as "OPEN" | "ACKNOWLEDGED" | "RESOLVED" },
    select: {
      id: true,
      type: true,
      status: true,
      message: true,
      createdAt: true,
      bus: { select: { busNumber: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ alerts });
}

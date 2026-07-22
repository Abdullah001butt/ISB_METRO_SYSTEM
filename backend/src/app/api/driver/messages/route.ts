import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = requireRole(request, "driver");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const unreadOnly = request.nextUrl.searchParams.get("unread") === "true";

  const messages = await prisma.driverMessage.findMany({
    where: { driverId: auth.sub, ...(unreadOnly ? { readAt: null } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ messages });
}

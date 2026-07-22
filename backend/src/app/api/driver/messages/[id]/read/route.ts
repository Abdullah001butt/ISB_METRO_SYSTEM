import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = requireRole(request, "driver");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const message = await prisma.driverMessage.findUnique({ where: { id } });
  if (!message || message.driverId !== auth.sub) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const updated = await prisma.driverMessage.update({
    where: { id },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ message: updated });
}

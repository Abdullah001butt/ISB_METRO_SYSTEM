import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = requireRole(request, "passenger");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const passenger = await prisma.passenger.findUnique({
    where: { id: auth.sub },
    select: { id: true, name: true, email: true },
  });

  if (!passenger) {
    return NextResponse.json({ error: "Passenger not found" }, { status: 404 });
  }

  return NextResponse.json({ passenger });
}

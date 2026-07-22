import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = requireRole(request, "driver");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const driver = await prisma.driver.findUnique({
    where: { id: auth.sub },
    select: {
      id: true,
      name: true,
      cnic: true,
      phone: true,
      email: true,
      buses: {
        select: {
          id: true,
          busNumber: true,
          capacity: true,
          isActive: true,
          route: {
            select: {
              id: true,
              name: true,
              busRoutes: {
                orderBy: { sequence: "asc" },
                select: { sequence: true, station: { select: { id: true, name: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  return NextResponse.json({ driver });
}

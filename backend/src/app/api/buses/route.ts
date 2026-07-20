import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { publicDriverSelect } from "@/lib/selects";
import { logActivity } from "@/lib/activityLog";
import { handleApiError } from "@/lib/errors";

const createSchema = z.object({
  busNumber: z.string().min(1),
  capacity: z.number().int().positive().optional(),
  driverId: z.string().optional(),
  routeId: z.string().optional(),
});

export async function GET() {
  const buses = await prisma.bus.findMany({
    orderBy: { busNumber: "asc" },
    include: { driver: { select: publicDriverSelect }, route: true },
  });
  return NextResponse.json({ buses });
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, "admin");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const bus = await prisma.bus.create({
      data: parsed.data,
      include: { driver: { select: publicDriverSelect }, route: true },
    });

    await logActivity(auth.sub, "bus.create", `Created bus "${bus.busNumber}" (${bus.id})`);
    return NextResponse.json({ bus }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

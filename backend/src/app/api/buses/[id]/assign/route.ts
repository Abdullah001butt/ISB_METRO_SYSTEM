import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { publicDriverSelect } from "@/lib/selects";
import { logActivity } from "@/lib/activityLog";
import { handleApiError } from "@/lib/errors";

const assignSchema = z.object({
  driverId: z.string().nullable().optional(),
  routeId: z.string().nullable().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = requireRole(request, "admin");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = assignSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const bus = await prisma.bus.update({
      where: { id },
      data: parsed.data,
      include: { driver: { select: publicDriverSelect }, route: true },
    });

    await logActivity(
      auth.sub,
      "bus.assign",
      `Assigned bus "${bus.busNumber}" to driver=${bus.driverId ?? "none"} route=${bus.routeId ?? "none"}`
    );
    return NextResponse.json({ bus });
  } catch (err) {
    return handleApiError(err);
  }
}

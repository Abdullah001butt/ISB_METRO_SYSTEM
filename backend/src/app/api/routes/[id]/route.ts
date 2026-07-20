import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";
import { handleApiError } from "@/lib/errors";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  stationIds: z.array(z.string()).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const route = await prisma.route.findUnique({
    where: { id },
    include: { busRoutes: { include: { station: true }, orderBy: { sequence: "asc" } } },
  });
  if (!route) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }
  return NextResponse.json({ route });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = requireRole(request, "admin");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { stationIds, ...rest } = parsed.data;

  try {
    const route = await prisma.route.update({
      where: { id },
      data: {
        ...rest,
        ...(stationIds
          ? {
              busRoutes: {
                deleteMany: {},
                create: stationIds.map((stationId, index) => ({
                  stationId,
                  sequence: index,
                })),
              },
            }
          : {}),
      },
      include: { busRoutes: { include: { station: true }, orderBy: { sequence: "asc" } } },
    });

    await logActivity(auth.sub, "route.update", `Updated route "${route.name}" (${route.id})`);
    return NextResponse.json({ route });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = requireRole(request, "admin");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await prisma.route.delete({ where: { id } });
    await logActivity(auth.sub, "route.delete", `Deleted route (${id})`);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}

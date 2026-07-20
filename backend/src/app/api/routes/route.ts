import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";
import { handleApiError } from "@/lib/errors";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  stationIds: z.array(z.string()).optional(),
});

export async function GET() {
  const routes = await prisma.route.findMany({
    orderBy: { name: "asc" },
    include: { busRoutes: { include: { station: true }, orderBy: { sequence: "asc" } } },
  });
  return NextResponse.json({ routes });
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

  const { name, description, stationIds } = parsed.data;

  try {
    const route = await prisma.route.create({
      data: {
        name,
        description,
        busRoutes: stationIds
          ? {
              create: stationIds.map((stationId, index) => ({
                stationId,
                sequence: index,
              })),
            }
          : undefined,
      },
      include: { busRoutes: { include: { station: true }, orderBy: { sequence: "asc" } } },
    });

    await logActivity(auth.sub, "route.create", `Created route "${route.name}" (${route.id})`);
    return NextResponse.json({ route }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

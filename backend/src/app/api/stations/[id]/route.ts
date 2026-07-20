import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";
import { handleApiError } from "@/lib/errors";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const station = await prisma.station.findUnique({ where: { id } });
  if (!station) {
    return NextResponse.json({ error: "Station not found" }, { status: 404 });
  }
  return NextResponse.json({ station });
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

  try {
    const station = await prisma.station.update({ where: { id }, data: parsed.data });
    await logActivity(auth.sub, "station.update", `Updated station "${station.name}" (${station.id})`);
    return NextResponse.json({ station });
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
    await prisma.station.delete({ where: { id } });
    await logActivity(auth.sub, "station.delete", `Deleted station (${id})`);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}

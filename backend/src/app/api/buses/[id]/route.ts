import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { publicDriverSelect } from "@/lib/selects";
import { logActivity } from "@/lib/activityLog";
import { handleApiError } from "@/lib/errors";

const updateSchema = z.object({
  busNumber: z.string().min(1).optional(),
  capacity: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const bus = await prisma.bus.findUnique({
    where: { id },
    include: { driver: { select: publicDriverSelect }, route: true },
  });
  if (!bus) {
    return NextResponse.json({ error: "Bus not found" }, { status: 404 });
  }
  return NextResponse.json({ bus });
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
    const bus = await prisma.bus.update({
      where: { id },
      data: parsed.data,
      include: { driver: { select: publicDriverSelect }, route: true },
    });

    await logActivity(auth.sub, "bus.update", `Updated bus "${bus.busNumber}" (${bus.id})`);
    return NextResponse.json({ bus });
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
    await prisma.bus.delete({ where: { id } });
    await logActivity(auth.sub, "bus.delete", `Deleted bus (${id})`);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}

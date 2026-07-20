import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";
import { handleApiError } from "@/lib/errors";

const createSchema = z.object({
  name: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
});

export async function GET() {
  const stations = await prisma.station.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ stations });
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
    const station = await prisma.station.create({ data: parsed.data });
    await logActivity(auth.sub, "station.create", `Created station "${station.name}" (${station.id})`);
    return NextResponse.json({ station }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

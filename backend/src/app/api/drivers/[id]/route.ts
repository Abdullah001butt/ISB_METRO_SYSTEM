import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";
import { handleApiError } from "@/lib/errors";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  isActive: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

function toPublicDriver(driver: { passwordHash: string; [key: string]: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = driver;
  return rest;
}

export async function GET(request: NextRequest, { params }: Params) {
  if (!requireRole(request, "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }
  return NextResponse.json({ driver: toPublicDriver(driver) });
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

  const { password, ...rest } = parsed.data;
  const data = password ? { ...rest, passwordHash: await bcrypt.hash(password, 10) } : rest;

  try {
    const driver = await prisma.driver.update({ where: { id }, data });
    await logActivity(auth.sub, "driver.update", `Updated driver "${driver.name}" (${driver.id})`);
    return NextResponse.json({ driver: toPublicDriver(driver) });
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
    await prisma.driver.delete({ where: { id } });
    await logActivity(auth.sub, "driver.delete", `Deleted driver (${id})`);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}

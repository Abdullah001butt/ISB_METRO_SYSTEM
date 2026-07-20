import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";
import { handleApiError } from "@/lib/errors";

const createSchema = z.object({
  name: z.string().min(1),
  cnic: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  password: z.string().min(6),
});

function toPublicDriver(driver: { passwordHash: string; [key: string]: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = driver;
  return rest;
}

export async function GET(request: NextRequest) {
  if (!requireRole(request, "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const drivers = await prisma.driver.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ drivers: drivers.map(toPublicDriver) });
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

  const { password, ...rest } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const driver = await prisma.driver.create({ data: { ...rest, passwordHash } });
    await logActivity(auth.sub, "driver.create", `Created driver "${driver.name}" (${driver.id})`);
    return NextResponse.json({ driver: toPublicDriver(driver) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

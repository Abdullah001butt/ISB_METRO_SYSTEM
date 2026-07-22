import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { enforceRateLimit, loginRateLimit } from "@/lib/rateLimit";

const bodySchema = z.object({
  cnic: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, loginRateLimit);
  if (limited) return limited;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { cnic, password } = parsed.data;

  const driver = await prisma.driver.findUnique({ where: { cnic } });
  if (!driver || !driver.isActive) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, driver.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const { token } = signToken({ sub: driver.id, role: "driver" });

  return NextResponse.json({
    token,
    driver: { id: driver.id, name: driver.name, cnic: driver.cnic },
  });
}

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { enforceRateLimit, loginRateLimit } from "@/lib/rateLimit";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, loginRateLimit);
  if (limited) return limited;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const passenger = await prisma.passenger.findUnique({ where: { email } });
  if (!passenger) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, passenger.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const { token } = signToken({ sub: passenger.id, role: "passenger" });

  return NextResponse.json({
    token,
    passenger: { id: passenger.id, name: passenger.name, email: passenger.email },
  });
}

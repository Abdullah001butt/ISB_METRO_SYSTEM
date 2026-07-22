import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { enforceRateLimit, loginRateLimit } from "@/lib/rateLimit";

const bodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, loginRateLimit);
  if (limited) return limited;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.passenger.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const passenger = await prisma.passenger.create({ data: { name, email, passwordHash } });

  const { token } = signToken({ sub: passenger.id, role: "passenger" });

  return NextResponse.json(
    { token, passenger: { id: passenger.id, name: passenger.name, email: passenger.email } },
    { status: 201 }
  );
}

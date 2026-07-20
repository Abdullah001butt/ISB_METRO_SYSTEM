import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { isValidAiServiceKey } from "@/lib/aiAuth";

export async function GET(request: NextRequest) {
  const isAdmin = Boolean(requireRole(request, "admin"));
  const isAiService = isValidAiServiceKey(request);
  if (!isAdmin && !isAiService) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const busId = request.nextUrl.searchParams.get("busId") ?? undefined;
  const sinceParam = request.nextUrl.searchParams.get("since");
  const limitParam = request.nextUrl.searchParams.get("limit");

  const limit = Math.min(Number(limitParam) || 1000, 5000);

  const logs = await prisma.gPSLog.findMany({
    where: {
      busId,
      recordedAt: sinceParam ? { gte: new Date(sinceParam) } : undefined,
    },
    orderBy: { recordedAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ logs });
}

import { prisma } from "@/lib/prisma";

export async function logActivity(adminId: string, action: string, details?: string) {
  await prisma.activityLog.create({ data: { adminId, action, details } });
}

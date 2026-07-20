import { NextRequest } from "next/server";
import { verifyToken, TokenPayload } from "@/lib/jwt";

export function getAuth(request: NextRequest): TokenPayload | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length);
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function requireRole(
  request: NextRequest,
  role: TokenPayload["role"]
): TokenPayload | null {
  const auth = getAuth(request);
  if (!auth || auth.role !== role) return null;
  return auth;
}

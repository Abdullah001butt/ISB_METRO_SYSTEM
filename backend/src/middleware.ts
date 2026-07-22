import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { isRevoked } from "@/lib/revocation";

const ALLOWED_ORIGINS = [
  "http://localhost:3001",
  "http://localhost:3002",
  "https://admin-portal-two-ashen.vercel.app",
  "https://passenger-portal-flame.vercel.app",
];

function corsHeaders(origin: string | null) {
  const headers = new Headers();
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
  return headers;
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const { payload } = await jwtVerify(authHeader.slice("Bearer ".length), JWT_SECRET);
      const { sub, role, jti, iat } = payload as {
        sub?: string;
        role?: "admin" | "driver";
        jti?: string;
        iat?: number;
      };
      if (sub && role && jti && iat && (await isRevoked(role, sub, jti, iat))) {
        return NextResponse.json(
          { error: "Session revoked. Please sign in again." },
          { status: 401, headers: corsHeaders(origin) }
        );
      }
    } catch {
      // Malformed/expired token — the route handler's own auth check will 401 it as before.
    }
  }

  const response = NextResponse.next();
  const headers = corsHeaders(origin);
  headers.forEach((value, key) => response.headers.set(key, value));
  return response;
}

export const config = {
  matcher: "/api/:path*",
};

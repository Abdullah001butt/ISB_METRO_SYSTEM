import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { revokeToken } from "@/lib/revocation";

export async function POST(request: NextRequest) {
  const auth = getAuth(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await revokeToken(auth.jti);
  return NextResponse.json({ success: true });
}

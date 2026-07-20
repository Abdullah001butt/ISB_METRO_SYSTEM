import { NextRequest } from "next/server";

export function isValidAiServiceKey(request: NextRequest): boolean {
  const key = request.headers.get("x-api-key");
  const expected = process.env.AI_API_KEY;
  return Boolean(expected) && key === expected;
}

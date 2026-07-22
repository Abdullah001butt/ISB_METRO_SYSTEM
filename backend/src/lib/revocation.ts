import { redis } from "@/lib/rateLimit";

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

function revokedJtiKey(jti: string) {
  return `revoked:jti:${jti}`;
}

function revokedBeforeKey(role: "admin" | "driver" | "passenger", subjectId: string) {
  return `revoked:before:${role}:${subjectId}`;
}

/** Revokes a single token immediately (logout). */
export async function revokeToken(jti: string): Promise<void> {
  await redis.set(revokedJtiKey(jti), "1", { ex: TOKEN_TTL_SECONDS });
}

/** Revokes every token issued to this subject before now (force logout everywhere). */
export async function revokeAllSessions(role: "admin" | "driver" | "passenger", subjectId: string): Promise<void> {
  await redis.set(revokedBeforeKey(role, subjectId), Date.now(), { ex: TOKEN_TTL_SECONDS });
}

/** True if the token should be rejected despite a valid signature. */
export async function isRevoked(
  role: "admin" | "driver" | "passenger",
  subjectId: string,
  jti: string,
  issuedAtSeconds: number
): Promise<boolean> {
  const [jtiRevoked, revokedBefore] = await Promise.all([
    redis.get<string>(revokedJtiKey(jti)),
    redis.get<number>(revokedBeforeKey(role, subjectId)),
  ]);
  if (jtiRevoked) return true;
  if (revokedBefore && issuedAtSeconds * 1000 < revokedBefore) return true;
  return false;
}

import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

export type TokenPayload = {
  sub: string;
  role: "admin" | "driver";
  jti: string;
  iat: number;
};

export function signToken(payload: { sub: string; role: "admin" | "driver" }): { token: string; jti: string } {
  const jti = randomUUID();
  const token = jwt.sign({ ...payload, jti }, JWT_SECRET as string, { expiresIn: "7d" });
  return { token, jti };
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET as string) as TokenPayload;
}

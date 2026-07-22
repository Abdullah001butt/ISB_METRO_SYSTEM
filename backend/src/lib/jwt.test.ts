import { describe, it, expect } from "vitest";
import { signToken, verifyToken } from "./jwt";

describe("signToken / verifyToken", () => {
  it("round-trips an admin payload", () => {
    const { token } = signToken({ sub: "admin-123", role: "admin" });
    const decoded = verifyToken(token);
    expect(decoded.sub).toBe("admin-123");
    expect(decoded.role).toBe("admin");
    expect(decoded.jti).toBeTruthy();
  });

  it("round-trips a driver payload", () => {
    const { token } = signToken({ sub: "driver-456", role: "driver" });
    const decoded = verifyToken(token);
    expect(decoded.sub).toBe("driver-456");
    expect(decoded.role).toBe("driver");
  });

  it("gives each token a unique jti", () => {
    const first = signToken({ sub: "admin-123", role: "admin" });
    const second = signToken({ sub: "admin-123", role: "admin" });
    expect(first.jti).not.toBe(second.jti);
  });

  it("throws when verifying a tampered token", () => {
    const { token } = signToken({ sub: "admin-123", role: "admin" });
    const tampered = token.slice(0, -2) + "xx";
    expect(() => verifyToken(tampered)).toThrow();
  });
});

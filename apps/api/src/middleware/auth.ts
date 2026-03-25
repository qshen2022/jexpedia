import { Context, Next } from "hono";
import jwt from "jsonwebtoken";

const AUTH_SECRET = process.env.AUTH_SECRET || "jexpedia-dev-secret-change-in-production";

export interface JwtPayload {
  sub: string; // userId
  email: string;
  name: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, AUTH_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, AUTH_SECRET) as JwtPayload;
}

export async function authMiddleware(c: Context, next: Next) {
  const header = c.req.header("Authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    c.set("userId", payload.sub);
    c.set("userEmail", payload.email);
    c.set("userName", payload.name);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
}

import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { signToken } from "../middleware/auth";

export async function signUp(name: string, email: string, password: string) {
  if (!name || !email || !password) {
    return { success: false, error: "All fields are required." };
  }

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  const existing = db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (existing) {
    return { success: false, error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = uuid();
  const createdAt = new Date().toISOString();

  try {
    db.insert(users)
      .values({ id, email, name, passwordHash, createdAt })
      .run();

    const token = signToken({ sub: id, email, name });
    return { success: true, token, user: { id, email, name } };
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("UNIQUE constraint")) {
      return { success: false, error: "An account with this email already exists." };
    }
    return { success: false, error: "Failed to create account. Please try again." };
  }
}

export async function signIn(email: string, password: string) {
  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  const user = db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (!user) {
    return { success: false, error: "Invalid email or password." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { success: false, error: "Invalid email or password." };
  }

  const token = signToken({ sub: user.id, email: user.email, name: user.name });
  return { success: true, token, user: { id: user.id, email: user.email, name: user.name } };
}

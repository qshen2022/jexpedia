import { Hono } from "hono";
import { signUp, signIn } from "../services/auth";

const app = new Hono();

app.post("/signup", async (c) => {
  const body = await c.req.json();
  const result = await signUp(
    body.name?.trim(),
    body.email?.trim().toLowerCase(),
    body.password
  );

  if (!result.success) {
    return c.json({ success: false, error: result.error }, 400);
  }

  return c.json(result);
});

app.post("/signin", async (c) => {
  const body = await c.req.json();
  const result = await signIn(
    body.email?.trim().toLowerCase(),
    body.password
  );

  if (!result.success) {
    return c.json({ success: false, error: result.error }, 401);
  }

  return c.json(result);
});

export default app;

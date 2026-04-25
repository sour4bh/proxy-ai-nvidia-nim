import { timingSafeEqual } from "node:crypto";
import type { MiddlewareHandler } from "hono";
import { config } from "./config.ts";
import { errors } from "./errors.ts";

export const requireApiKey: MiddlewareHandler = async (c, next) => {
  const header = c.req.header("authorization") ?? "";
  const expected = `Bearer ${config.proxyApiKey}`;
  if (!equals(header, expected)) return c.json(errors.invalidApiKey(), 401);
  await next();
};

function equals(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

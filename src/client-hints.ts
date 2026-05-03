import type { Context } from "hono";
import { getConnInfo } from "@hono/node-server/conninfo";

export function clientHints(c: Context): { userAgent: string; clientIp?: string } {
  const userAgent = c.req.header("user-agent") ?? "";
  const xff = c.req.header("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return { userAgent, clientIp: first };
  }
  try {
    const addr = getConnInfo(c)?.remote?.address;
    if (addr) return { userAgent, clientIp: addr };
  } catch {
    /* non-Node adapter */
  }
  return { userAgent };
}

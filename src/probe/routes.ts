import type { Hono } from "hono";
import { probePage } from "./page.ts";
import type { ProbeController } from "./controller.ts";
import { aliasEntries, updateAliases } from "../aliases.ts";

function isAliasMap(input: unknown): input is Record<string, string> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return false;
  return Object.entries(input).every(
    ([key, value]) => key.trim().length > 0 && typeof value === "string" && value.trim().length > 0,
  );
}

export function mountProbeRoutes(app: Hono, controller: ProbeController): void {
  app.get("/probe", (c) => c.html(probePage()));

  app.get("/probe/state", async (c) => c.json(await controller.state()));

  app.get("/probe/aliases", (c) => c.json({ aliases: aliasEntries() }));

  app.put("/probe/aliases", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Body must be valid JSON" }, 400);
    }
    const aliases = (body as { aliases?: unknown }).aliases;
    if (!isAliasMap(aliases)) {
      return c.json({ error: "aliases must be an object of non-empty key/value strings" }, 400);
    }
    updateAliases(aliases);
    return c.json({ updated: true, aliases: aliasEntries() });
  });

  app.post("/probe/run", (c) => {
    const result = controller.triggerManual();
    if (!result.accepted) {
      return c.json({ error: "probe already running", run: result.run }, 409);
    }
    return c.json({ accepted: true, run: result.run }, 202);
  });
}

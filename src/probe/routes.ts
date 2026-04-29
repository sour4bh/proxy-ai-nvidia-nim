import type { Hono } from "hono";
import { probePage } from "./page.ts";
import type { ProbeController } from "./controller.ts";

export function mountProbeRoutes(app: Hono, controller: ProbeController): void {
  app.get("/probe", (c) => c.html(probePage()));

  app.get("/probe/state", async (c) => c.json(await controller.state()));

  app.post("/probe/run", (c) => {
    const result = controller.triggerManual();
    if (!result.accepted) {
      return c.json({ error: "probe already running", run: result.run }, 409);
    }
    return c.json({ accepted: true, run: result.run }, 202);
  });
}

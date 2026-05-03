import { getUpstreamModelsSnapshot, type ModelEntry } from "../models.ts";
import { chatModelIds } from "./run.ts";
import { isNewModel, loadModelSeen, type ModelSeenRecord } from "./model-seen.ts";
import { aggregateTimelines, type TimelinePoint } from "./timeline.ts";
import type { ProbeHistory } from "./history.ts";

export type CatalogEntry = ModelEntry & {
  probed: boolean;
  seen: ModelSeenRecord | null;
  timeline: TimelinePoint[];
  isNew: boolean;
};

export async function buildProbeCatalog(
  history: ProbeHistory,
  historyDir: string,
  nowMs: number,
): Promise<
  { ok: true; probeChatIds: string[]; filteredOut: number; entries: CatalogEntry[] } | { ok: false; error: string }
> {
  const upstream = getUpstreamModelsSnapshot();
  if (!upstream) return { ok: false, error: "catalog_unavailable" };
  const { ids: probeChatIds, skipped: filteredOut } = chatModelIds([...upstream]);
  const seen = await loadModelSeen(historyDir);
  const runs = await history.listRuns();
  const timelines = aggregateTimelines(runs, 10);
  const probeSet = new Set(probeChatIds);
  const entries: CatalogEntry[] = upstream.map((m) => {
    const rec = seen[m.id];
    return {
      ...m,
      probed: probeSet.has(m.id),
      seen: rec ? { firstSeenAt: rec.firstSeenAt, lastSeenAt: rec.lastSeenAt } : null,
      timeline: timelines[m.id] ?? [],
      isNew: rec ? isNewModel(rec.firstSeenAt, nowMs) : false,
    };
  });
  return { ok: true, probeChatIds, filteredOut, entries };
}

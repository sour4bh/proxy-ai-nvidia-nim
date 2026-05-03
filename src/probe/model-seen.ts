import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export type ModelSeenRecord = {
  firstSeenAt: string;
  lastSeenAt: string;
};

export type ModelSeenMap = Record<string, ModelSeenRecord>;

const FILE = "model-seen.json";

export function modelSeenPath(historyDir: string): string {
  return join(historyDir, FILE);
}

export async function loadModelSeen(historyDir: string): Promise<ModelSeenMap> {
  try {
    const raw = await readFile(modelSeenPath(historyDir), "utf8");
    const j = JSON.parse(raw) as unknown;
    if (!j || typeof j !== "object" || Array.isArray(j)) return {};
    return j as ModelSeenMap;
  } catch {
    return {};
  }
}

export async function saveModelSeen(historyDir: string, map: ModelSeenMap): Promise<void> {
  await mkdir(historyDir, { recursive: true });
  await writeFile(modelSeenPath(historyDir), `${JSON.stringify(map, null, 2)}\n`);
}

export function mergeCatalogSnapshot(
  prev: ModelSeenMap,
  ids: readonly string[],
  nowIso: string,
): ModelSeenMap {
  const next = { ...prev };
  for (const id of ids) {
    const cur = next[id];
    if (cur) next[id] = { firstSeenAt: cur.firstSeenAt, lastSeenAt: nowIso };
    else next[id] = { firstSeenAt: nowIso, lastSeenAt: nowIso };
  }
  return next;
}

export function touchProbeModels(prev: ModelSeenMap, modelIds: readonly string[], nowIso: string): ModelSeenMap {
  const next = { ...prev };
  for (const id of modelIds) {
    const cur = next[id];
    if (cur) next[id] = { firstSeenAt: cur.firstSeenAt, lastSeenAt: nowIso };
    else next[id] = { firstSeenAt: nowIso, lastSeenAt: nowIso };
  }
  return next;
}

export const NEW_MODEL_DAYS = 7;

export function isNewModel(firstSeenAt: string, nowMs: number): boolean {
  const t = Date.parse(firstSeenAt);
  if (!Number.isFinite(t)) return false;
  return nowMs - t < NEW_MODEL_DAYS * 86_400_000;
}

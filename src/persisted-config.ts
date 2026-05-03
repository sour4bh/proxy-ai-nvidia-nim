import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, watch, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { replaceAliases } from "./alias-map.ts";
import { log as logExport } from "./log.ts";

type Log = typeof logExport;

export type PersistedConfigJson = Record<string, unknown>;

let resolvedPath: string | null = null;
let cliAliasesMergeBase: Record<string, string> = {};
let selfWriteUntil = 0;
let reloadTimer: ReturnType<typeof setTimeout> | null = null;
let dirWatcher: ReturnType<typeof watch> | null = null;
let fileWatcher: ReturnType<typeof watch> | null = null;

export function normalizeConfigPath(relativeOrAbsolute: string): string {
  const t = relativeOrAbsolute.trim();
  return isAbsolute(t) ? t : resolve(process.cwd(), t);
}

export function sanitizeAliases(input: unknown): Record<string, string> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (typeof k === "string" && k.trim().length > 0 && typeof v === "string" && v.trim().length > 0) {
      out[k.trim()] = v.trim();
    }
  }
  return out;
}

function readRawJson(path: string): { ok: true; value: PersistedConfigJson } | { ok: false; error: string } {
  if (!existsSync(path)) return { ok: true, value: {} };
  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, error: "root_must_be_object" };
    }
    return { ok: true, value: parsed as PersistedConfigJson };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

function applyAliasesFromDisk(log: Log): void {
  if (!resolvedPath) return;
  const raw = readRawJson(resolvedPath);
  if (!raw.ok) {
    log({ event: "persisted_config_invalid", path: resolvedPath, error: raw.error });
    return;
  }
  const fromFile = sanitizeAliases(raw.value.aliases);
  replaceAliases({ ...cliAliasesMergeBase, ...fromFile });
  log({ event: "persisted_config_applied", path: resolvedPath, fileAliasCount: Object.keys(fromFile).length });
}

function markSelfWrite(): void {
  selfWriteUntil = Date.now() + 900;
}

function atomicWriteJson(path: string, data: PersistedConfigJson): void {
  const dir = dirname(path);
  mkdirSync(dir, { recursive: true });
  const tmp = join(dir, `.${basename(path)}.${randomBytes(8).toString("hex")}.tmp`);
  const body = `${JSON.stringify(data, null, 2)}\n`;
  try {
    writeFileSync(tmp, body, "utf8");
    renameSync(tmp, path);
  } catch (e) {
    try {
      unlinkSync(tmp);
    } catch {
      /* */
    }
    throw e;
  }
  markSelfWrite();
}

/** Replace `aliases` in the JSON file and keep other top-level keys. */
export function mergeWritePersistedAliases(aliases: Record<string, string>): void {
  if (!resolvedPath) throw new Error("persisted config not initialized");
  const prev = readRawJson(resolvedPath);
  const base: PersistedConfigJson = prev.ok ? { ...prev.value } : {};
  base.aliases = { ...aliases };
  atomicWriteJson(resolvedPath, base);
}

export function getPersistedConfigSnapshot(): {
  path: string;
  exists: boolean;
  parseError?: string;
  config: PersistedConfigJson | null;
} {
  if (!resolvedPath) {
    throw new Error("persisted config not initialized");
  }
  const exists = existsSync(resolvedPath);
  if (!exists) {
    return { path: resolvedPath, exists: false, config: {} };
  }
  const raw = readRawJson(resolvedPath);
  if (!raw.ok) {
    return { path: resolvedPath, exists: true, parseError: raw.error, config: null };
  }
  return { path: resolvedPath, exists: true, config: raw.value };
}

function clearWatchers(): void {
  if (reloadTimer) {
    clearTimeout(reloadTimer);
    reloadTimer = null;
  }
  try {
    dirWatcher?.close();
  } catch {
    /* */
  }
  try {
    fileWatcher?.close();
  } catch {
    /* */
  }
  dirWatcher = null;
  fileWatcher = null;
}

function scheduleReload(log: Log): void {
  if (Date.now() < selfWriteUntil) return;
  if (reloadTimer) clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    reloadTimer = null;
    applyAliasesFromDisk(log);
  }, 300);
}

function attachWatchers(log: Log): void {
  if (!resolvedPath) return;
  clearWatchers();
  const path = resolvedPath;
  const dir = dirname(path);
  const base = basename(path);

  try {
    mkdirSync(dir, { recursive: true });
  } catch (e) {
    log({ event: "persisted_config_mkdir_failed", dir, error: (e as Error).message });
  }

  try {
    if (existsSync(path)) {
      fileWatcher = watch(path, () => scheduleReload(log));
    }
  } catch (e) {
    log({ event: "persisted_config_watch_file_failed", path, error: (e as Error).message });
  }

  try {
    dirWatcher = watch(dir, (event, fname) => {
      if (fname && fname !== base) return;
      scheduleReload(log);
    });
  } catch (e) {
    log({ event: "persisted_config_watch_dir_failed", dir, error: (e as Error).message });
  }
}

/** Load persisted aliases, start watching the file for SSH-side edits. */
/** @param cliAliases — merged under file aliases (file wins); defaults from server via `config.aliases`. */
export function bootstrapPersistedConfig(opts: {
  path: string;
  log: Log;
  cliAliases?: Record<string, string>;
}): void {
  clearWatchers();
  cliAliasesMergeBase = opts.cliAliases ? { ...opts.cliAliases } : {};
  resolvedPath = normalizeConfigPath(opts.path);
  applyAliasesFromDisk(opts.log);
  attachWatchers(opts.log);
}

export function shutdownPersistedConfig(): void {
  clearWatchers();
  resolvedPath = null;
  cliAliasesMergeBase = {};
}

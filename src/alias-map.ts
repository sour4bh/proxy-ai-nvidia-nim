import { config } from "./config.ts";

type AliasRecord = Record<string, string>;

let aliasMap: AliasRecord = { ...config.aliases };

export function resolveAlias(model: string): string {
  return aliasMap[model] ?? model;
}

export function listAliases(): Array<{ id: string; resolved: string }> {
  return Object.entries(aliasMap).map(([id, resolved]) => ({ id, resolved }));
}

export function replaceAliases(next: AliasRecord): void {
  aliasMap = { ...next };
}

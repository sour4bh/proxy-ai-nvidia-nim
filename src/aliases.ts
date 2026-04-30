import { listAliases, replaceAliases, resolveAlias } from "./alias-map.ts";

export function resolveModel(model: string): string {
  return resolveAlias(model);
}

export function aliasEntries(): Array<{ id: string; resolved: string }> {
  return listAliases();
}

export function updateAliases(next: Record<string, string>): void {
  replaceAliases(next);
}

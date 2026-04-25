import { config } from "./config.ts";

export function resolveModel(model: string): string {
  return config.aliases[model] ?? model;
}

export function aliasEntries(): Array<{ id: string; resolved: string }> {
  return Object.entries(config.aliases).map(([id, resolved]) => ({ id, resolved }));
}

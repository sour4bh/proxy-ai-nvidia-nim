import { randomBytes } from "node:crypto";

export function reqId(): string {
  return randomBytes(6).toString("hex");
}

export function log(record: Record<string, unknown>): void {
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...record }));
}

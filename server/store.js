import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export function loadWorkspaces(dataFile) {
  if (!dataFile || !existsSync(dataFile)) {
    return new Map();
  }

  const raw = readFileSync(dataFile, "utf8");
  const payload = JSON.parse(raw || "[]");
  return new Map(payload.map((workspace) => [workspace.id, workspace]));
}

export function saveWorkspaces(dataFile, workspaces) {
  if (!dataFile) return;

  mkdirSync(dirname(dataFile), { recursive: true });
  const payload = JSON.stringify([...workspaces.values()], null, 2);
  writeFileSync(dataFile, payload);
}

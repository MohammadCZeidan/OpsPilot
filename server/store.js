import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export function loadWorkspaces(dataFile) {
  if (!dataFile || !existsSync(dataFile)) {
    return new Map();
  }

  const raw = readFileSync(dataFile, "utf8");
  const payload = JSON.parse(raw || "[]");
  const workspaces = Array.isArray(payload) ? payload : payload.workspaces || [];
  return new Map(workspaces.map((workspace) => [workspace.id, workspace]));
}

export function loadUsers(dataFile) {
  if (!dataFile || !existsSync(dataFile)) {
    return new Map();
  }

  const raw = readFileSync(dataFile, "utf8");
  const payload = JSON.parse(raw || "{}");
  const users = Array.isArray(payload) ? [] : payload.users || [];
  return new Map(users.map((user) => [user.email, user]));
}

export function saveAppState(dataFile, { workspaces, users }) {
  if (!dataFile) return;

  mkdirSync(dirname(dataFile), { recursive: true });
  const payload = JSON.stringify(
    {
      users: [...users.values()],
      workspaces: [...workspaces.values()],
    },
    null,
    2
  );
  writeFileSync(dataFile, payload);
}

export function saveWorkspaces(dataFile, workspaces) {
  saveAppState(dataFile, { workspaces, users: new Map() });
}

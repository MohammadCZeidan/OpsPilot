import request from "supertest";
import { describe, expect, test } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createApp } from "./app.js";

describe("OpsPilot API", () => {
  test("creates a workspace, ingests text, answers with citations, records feedback, and returns logs", async () => {
    const app = createApp();
    const token = await authToken(app);

    const workspaceResponse = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Demo Workspace", email: "founder@example.com" })
      .expect(201);

    const workspaceId = workspaceResponse.body.workspace.id;

    await request(app)
      .post(`/api/workspaces/${workspaceId}/documents`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        filename: "runbook.md",
        mimeType: "text/markdown",
        text: "Refund requests are delayed because agents manually inspect invoices before approval.",
      })
      .expect(201);

    const queryResponse = await request(app)
      .post(`/api/workspaces/${workspaceId}/query`)
      .set("Authorization", `Bearer ${token}`)
      .send({ question: "Why are refund requests delayed?" })
      .expect(200);

    expect(queryResponse.body.answer).toContain("Refund requests are delayed");
    expect(queryResponse.body.citations[0].citation).toBe("runbook.md#chunk-1");

    await request(app)
      .post(`/api/workspaces/${workspaceId}/feedback`)
      .set("Authorization", `Bearer ${token}`)
      .send({ queryId: queryResponse.body.id, rating: "missing_context" })
      .expect(201);

    const logsResponse = await request(app).get(`/api/workspaces/${workspaceId}/logs`).set("Authorization", `Bearer ${token}`).expect(200);
    expect(logsResponse.body.logs.some((log) => log.event === "query")).toBe(true);

    const listResponse = await request(app).get("/api/workspaces").set("Authorization", `Bearer ${token}`).expect(200);
    expect(listResponse.body.workspaces).toEqual([
      expect.objectContaining({
        id: workspaceId,
        documentCount: 1,
        conversationCount: 1,
        feedbackCount: 1,
      }),
    ]);

    const documentsResponse = await request(app).get(`/api/workspaces/${workspaceId}/documents`).set("Authorization", `Bearer ${token}`).expect(200);
    expect(documentsResponse.body.documents).toEqual([
      expect.objectContaining({
        filename: "runbook.md",
        chunkCount: 1,
      }),
    ]);

    const conversationsResponse = await request(app)
      .get(`/api/workspaces/${workspaceId}/conversations`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(conversationsResponse.body.conversations[0].question).toBe("Why are refund requests delayed?");
  });

  test("rejects unsupported document uploads before ingestion", async () => {
    const app = createApp();
    const token = await authToken(app);
    const workspaceResponse = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Uploads" })
      .expect(201);
    const workspaceId = workspaceResponse.body.workspace.id;

    await request(app)
      .post(`/api/workspaces/${workspaceId}/documents`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        filename: "slides.pdf",
        mimeType: "application/pdf",
        text: "",
      })
      .expect(400);
  });
});

describe("OpsPilot API persistence", () => {
  test("restores workspaces and ingested documents from disk", async () => {
    const directory = await mkdtemp(join(tmpdir(), "opspilot-"));
    const dataFile = join(directory, "workspaces.json");

    try {
      const firstApp = createApp({ dataFile });
      const persistentEmail = `persist-${crypto.randomUUID()}@example.com`;
      const firstToken = await authToken(firstApp, persistentEmail);
      const workspaceResponse = await request(firstApp)
        .post("/api/workspaces")
        .set("Authorization", `Bearer ${firstToken}`)
        .send({ name: "Persistent Workspace", email: "founder@example.com" })
        .expect(201);

      const workspaceId = workspaceResponse.body.workspace.id;

      await request(firstApp)
        .post(`/api/workspaces/${workspaceId}/documents`)
        .set("Authorization", `Bearer ${firstToken}`)
        .send({
          filename: "memory.txt",
          mimeType: "text/plain",
          text: "The workspace should survive a server restart.",
        })
        .expect(201);

      const secondApp = createApp({ dataFile });
      const loginResponse = await request(secondApp)
        .post("/api/auth/login")
        .send({ email: persistentEmail, password: "secret123" })
        .expect(200);
      const secondToken = loginResponse.body.token;
      const restoredResponse = await request(secondApp)
        .get(`/api/workspaces/${workspaceId}`)
        .set("Authorization", `Bearer ${secondToken}`)
        .expect(200);

      expect(restoredResponse.body.workspace).toMatchObject({
        id: workspaceId,
        name: "Persistent Workspace",
        documentCount: 1,
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

async function authToken(app, email = `tester-${crypto.randomUUID()}@example.com`) {
  const response = await request(app).post("/api/auth/register").send({ email, password: "secret123" }).expect(201);
  return response.body.token;
}
